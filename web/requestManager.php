<?php
require __DIR__ . '/../vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Dotenv\Dotenv;
use Elliptic\EC;
use kornrunner\RLP\RLP;
//use phpseclib\Math\BigInteger;
//use kornrunner\Ethereum\Transaction;
use kornrunner\Keccak;

header('Content-Type: application/json');
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/api.log');
error_log("requestManager iniciou!");

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$rpcUrl = $_ENV['RPC_URL'];
$contractAddress = $_ENV['REQUEST_MANAGER_CONTRACT_ADDRESS'];
$privateKey = $_ENV['PRIVATE_KEY'];
$adminAddress = $_ENV['ADMIN_ADDRESS'];

$web3 = new Web3(new HttpProvider($rpcUrl));
$contractABI = file_get_contents(__DIR__ . '/../ABI/RequestManagerABI.json');
$contract = new Contract($web3->provider, $contractABI);
$contract->at($contractAddress);

$inputJSON = file_get_contents("php://input");
$input = json_decode($inputJSON, true);
$action = $input['action'] ?? $_GET['action'] ?? null;

//error_log("Método: " . $_SERVER['REQUEST_METHOD']);
//error_log("Ação recebida: " . $action);

// Registrar um novo circuito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'requestCircuit') {
    prepareData($input);
}
// Aprovar um circuito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'approveCircuit') {
    $id = $_GET['id'];
    $functionData = $contract->getData('approveCircuit', $id);
    sendTransaction($functionData);
}

// Rejeitar um circuito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'rejectCircuit') {
    $id = $_GET['id'];
    $functionData = $contract->getData('rejectCircuit', $id);
    sendTransaction($functionData);
}

// Consultar um circuito
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'getCircuit') {
    $id = $_GET['id'];
    $contract->call('getCircuitRequest', $id, function ($err, $result) {
        if ($err !== null) {
            echo json_encode(['error' => $err->getMessage()]);
        } else {
            echo json_encode($result);
        }
    });
}

function signTransaction($transaction, $privateKey) {
    $ec = new EC('secp256k1');
    $rlp = new RLP();

    //Criar a transação no formato RLP
    $txData = [
        $transaction['nonce'],
        $transaction['gasPrice'],
        $transaction['gas'],
        $transaction['to'],
        $transaction['value'],
        $transaction['data'],
        $transaction['chainId'],
        '0x', // Empty R
        '0x'  // Empty S
    ];

    //Serializar a transação para obter o hash a ser assinado
    $encodedTx = $rlp->encode($txData);
    $txHash = Keccak::hash(hex2bin($encodedTx), 256);

    //Criar a chave privada e assinar a transação
    $key = $ec->keyFromPrivate($privateKey);
    $signature = $key->sign($txHash, ['canonical' => true]);

    //Ajustar r, s e v
    $r = str_pad($signature->r->toString(16), 64, '0', STR_PAD_LEFT);
    $s = str_pad($signature->s->toString(16), 64, '0', STR_PAD_LEFT);
    $v = $signature->recoveryParam + 27; // Certifica-se que v seja 27 ou 28
    if ($v !== 27 && $v !== 28) {
        $v = 27;
    }

    error_log("Assinatura gerada: R = 0x{$r}, S = 0x{$s}, V = 0x{$v}");
    
    $vHex = '0x' . dechex($v);
    //Adicionar assinatura à transação
    $signedTxData = [
        $transaction['nonce'],
        $transaction['gasPrice'],
        $transaction['gas'],
        $transaction['to'],
        $transaction['value'],
        $transaction['data'],
        $vHex, 
        '0x' . $r, 
        '0x' . $s  
    ];

    //Serializar a transação assinada
    $signedTx = $rlp->encode($signedTxData);

    return '0x' . $signedTx;
}

function sendTransaction($functionData) {
    global $web3, $contractAddress, $privateKey, $adminAddress;

    $web3->eth->getTransactionCount($adminAddress, 'latest', function ($err, $nonce) use ($contractAddress, $privateKey, $adminAddress, $functionData, $web3) {
        if ($err !== null) {
            error_log("Erro ao obter nonce: " . $err->getMessage());
            echo json_encode(['error' => "Erro ao obter nonce: " . $err->getMessage()]);
            return;
        }

        $nonceHex = '0x' . dechex((int) $nonce->toString());

        //Estimando gás
        $params = [
            'from' => strtolower($adminAddress),
            'to' => strtolower($contractAddress),
            'data' => $functionData
        ];

        error_log("Estimando gás com os parâmetros: " . print_r($params, true));

        $web3->eth->estimateGas($params, function ($err, $estimatedGas) use ($contractAddress, $privateKey, $adminAddress, $functionData, $nonceHex, $web3) {
            if ($err !== null) {
                error_log("Erro ao estimar gás: " . $err->getMessage());
                echo json_encode(['error' => "Erro ao estimar gás: " . $err->getMessage()]);
                return;
            }

            //Adiciona 10% de margem ao gas limit
            $estimatedGas = hexdec($estimatedGas->toString());
            $gasLimit = (int) ($estimatedGas * 1.1);
            $gasHex = '0x' . dechex($gasLimit);

            // Gas Price fixado inicialmente
            $gasPrice = 2000000000;
            $gasPriceHex = '0x' . dechex($gasPrice);

            //Obtém o saldo antes de enviar a transação
            $web3->eth->getBalance($adminAddress, function ($err, $balance) use ($gasLimit, &$gasHex, &$gasPriceHex, $gasPrice, $contractAddress, $functionData, $nonceHex, $privateKey, $web3) {
                if ($err !== null) {
                    error_log("Erro ao obter saldo: " . $err->getMessage());
                    echo json_encode(['error' => "Erro ao obter saldo: " . $err->getMessage()]);
                    return;
                }

                $saldoDisponivel = hexdec($balance->toString());
                $totalGasCost = $gasLimit * $gasPrice;

                error_log("Saldo disponível: " . $saldoDisponivel . " wei");
                error_log("Custo total do gás: " . $totalGasCost . " wei");

                //Se o saldo for insuficiente, reduz o gasPrice
                /*if ($saldoDisponivel < $totalGasCost) {
                    $gasPrice = (int) ($gasPrice * 0.5); // Reduz para metade
                    $gasPriceHex = '0x' . dechex($gasPrice);
                    error_log("Saldo insuficiente. Novo Gas Price ajustado: " . $gasPrice . " wei");
                }*/

                //Criando a transação com valores finais
                $transaction = [
                    'nonce' => $nonceHex,
                    'to' => $contractAddress,
                    'gas' => $gasHex, // Gas Limit atualizado
                    'gasPrice' => $gasPriceHex, // Gas Price ajustado
                    'value' => '0x0',
                    'data' => $functionData,
                    'chainId' => 1337
                ];

                error_log("Gas Price final: " . hexdec($transaction['gasPrice']) . " wei");
                error_log("Gas Limit final: " . hexdec($transaction['gas']) . " unidades");
                
                
                $gasLimit = hexdec($transaction['gas']);  // Convertendo gasLimit de hexadecimal para decimal
                $gasPrice = hexdec($transaction['gasPrice']);  // Convertendo gasPrice de hexadecimal para decimal
                $value = hexdec($transaction['value']);  // Valor transferido na transação
                $totalCost = $gasLimit * $gasPrice + $value; // Calcula custo total em wei
                
                error_log("Cálculo do custo total: Gas Limit ($gasLimit) * Gas Price ($gasPrice) + Value ($value) = $totalCost wei");

                //Assinando a transação
                $signedTransaction = signTransaction($transaction, $privateKey);

                error_log("Transação assinada: " . $signedTransaction);

                //Enviando a transação assinada
                $web3->eth->sendRawTransaction($signedTransaction, function ($err, $txHash) {
                    if ($err !== null) {
                        error_log("Erro ao enviar transação: " . $err->getMessage());
                        echo json_encode(['error' => "Erro ao enviar transação: " . $err->getMessage()]);
                    } else {
                        error_log("Transação enviada com sucesso! Hash: " . $txHash);
                        echo json_encode(['transactionHash' => $txHash]);
                    }
                });
            });
        });
    });
}

function prepareData($data){
    global $web3, $contractAddress, $privateKey, $adminAddress, $contract;

    // Validação dos campos obrigatórios
    $requiredFields = ['source', 'destination', 'bandwidth', 'startTime', 'endTime', 'path'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            echo json_encode(['error' => "Campo '$field' é obrigatório."]);
            return;
        }
    }

    // Formatação dos dados
    $recurring = filter_var($data['recurring'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;

    // Logs para depuração
    error_log("Dados para getData: " . print_r([
        'source' => $data['source'],
        'destination' => $data['destination'],
        'bandwidth' => $data['bandwidth'],
        'startTime' => $data['startTime'],
        'endTime' => $data['endTime'],
        'recurring' => $recurring,
        'path' => $data['path']
    ], true));

    try {
        $functionData = $contract->getData(
            'requestCircuit',
            $data['source'],
            $data['destination'],
            $data['bandwidth'],
            (int) $data['startTime'],
            (int) $data['endTime'],
            (bool) $recurring,
            (string) $data['path']
        );

        if (!is_string($functionData) || substr($functionData, 0, 2) !== '0x') {
            $functionData = "0x" . $functionData;
        }

        $web3->eth->getBalance($adminAddress, function ($err, $balance) {
            if ($err !== null) {
                error_log("Erro ao obter saldo: " . $err->getMessage());
            } else {
                error_log("Saldo real antes do envio: " . $balance->toString() . " wei");
            }
        });     
      
        
        sendTransaction($functionData);
    } catch (Exception $e) {
        error_log("Erro ao chamar getData(): " . $e->getMessage());
        echo json_encode(['error' => "Erro ao chamar getData(): " . $e->getMessage()]);
    }
}
?>
