<?php
require 'vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Dotenv\Dotenv;

// Carregar variáveis de ambiente
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configurar Web3
$rpcUrl = $_ENV['RPC_URL'] ?? 'http://127.0.0.1:8545'; // Definir um padrão se estiver vazio
$contractAddress = $_ENV['CONTRACT_ADDRESS'] ?? '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';

$web3 = new Web3(new HttpProvider($rpcUrl));
$contractABI = file_get_contents('contractABI.json');
$contract = new Contract($web3->provider, $contractABI);
$contract->at($contractAddress);

$testFunctionData = $contract->getData('approveCircuit', '0xabc123');
var_dump($testFunctionData);

try {
    // Testar `getData()` com valores fixos
    $functionData = $contract->getData(
        'requestCircuit',
        'São Paulo',
        'Nova York',
        100,
        ['0xabc123', '0xdef456'],
        ['Verificação de Usuário', 'Regra de Segurança'],
        ['Apenas usuários autenticados', 'Segurança de conexão reforçada'],
        1717603200,
        1717606800,
        false,
        'SP-RJ-NY'
    );

    echo "Function Data: " . $functionData . PHP_EOL;
} catch (Exception $e) {
    echo "Erro ao chamar getData(): " . $e->getMessage() . PHP_EOL;
}


?>
