<?php
require __DIR__ . '/../vendor/autoload.php';

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use kornrunner\Keccak;
use Elliptic\EC;
use kornrunner\RLP\RLP;
use Dotenv\Dotenv;

header('Content-Type: application/json');
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/api.log');

// Verifica o arquivo
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'Arquivo inválido.']);
    exit;
}

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$rpcUrl = $_ENV['RPC_URL'];
$contractAddress = $_ENV['FILE_REGISTRY_CONTRACT_ADDRESS'];
$privateKey = $_ENV['PRIVATE_KEY'];
$adminAddress = $_ENV['ADMIN_ADDRESS'];

$web3 = new Web3(new HttpProvider($rpcUrl));
$contractABI = file_get_contents(__DIR__ . '/../ABI/FileRegistryABI.json');
$contract = new Contract($web3->provider, $contractABI);
$contract->at($contractAddress);

// Calcula a hash do conteúdo do arquivo
$file = $_FILES['file']['tmp_name'];
$content = file_get_contents($file);
$hash = hash('sha256', $content);
$hashHex = "0x" . $hash;


error_log("Hash gerada: $hashHex");

// Prepara os dados da transação
$contract->getData('registerFileHash', $hashHex, function ($err, $data) use ($web3, $contractAddress, $adminAddress, $privateKey) {
    if ($err !== null) {
        echo json_encode(['error' => 'Erro ao gerar dados da função.']);
        return;
    }

    $web3->eth->getTransactionCount($adminAddress, 'latest', function ($err, $nonce) use ($web3, $data, $contractAddress, $adminAddress, $privateKey) {
        if ($err !== null) {
            echo json_encode(['error' => 'Erro ao obter nonce.']);
            return;
        }

        $transaction = [
            'nonce' => '0x' . dechex($nonce->toString()),
            'to' => $contractAddress,
            'gas' => '0x5208',
            'gasPrice' => '0x3B9ACA00', // 1 Gwei
            'value' => '0x0',
            'data' => $data,
            'chainId' => 1337
        ];

        $signed = signTransaction($transaction, $privateKey);

        $web3->eth->sendRawTransaction($signed, function ($err, $txHash) {
            if ($err !== null) {
                echo json_encode(['error' => $err->getMessage()]);
                return;
            }
            echo json_encode(['success' => true, 'transactionHash' => $txHash]);
        });
    });
});

function signTransaction($transaction, $privateKey) {
    $ec = new EC('secp256k1');
    $rlp = new RLP();

    $tx = [
        $transaction['nonce'],
        $transaction['gasPrice'],
        $transaction['gas'],
        $transaction['to'],
        $transaction['value'],
        $transaction['data'],
        $transaction['chainId'],
        '0x',
        '0x'
    ];

    $encoded = $rlp->encode($tx);
    $hash = Keccak::hash(hex2bin($encoded), 256);

    $key = $ec->keyFromPrivate($privateKey);
    $signature = $key->sign($hash, ['canonical' => true]);

    $r = '0x' . str_pad($signature->r->toString(16), 64, '0', STR_PAD_LEFT);
    $s = '0x' . str_pad($signature->s->toString(16), 64, '0', STR_PAD_LEFT);
    $v = $signature->recoveryParam + (int) $transaction['chainId'] * 2 + 35;

    $signedTx = [
        $transaction['nonce'],
        $transaction['gasPrice'],
        $transaction['gas'],
        $transaction['to'],
        $transaction['value'],
        $transaction['data'],
        '0x' . dechex($v),
        $r,
        $s
    ];

    return '0x' . $rlp->encode($signedTx);
}
?>