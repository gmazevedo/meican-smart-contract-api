<?php
require 'vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;
use Dotenv\Dotenv;

header('Content-Type: application/json');

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$rpcUrl = $_ENV['RPC_URL'];
$contractAddress = $_ENV['CONTRACT_ADDRESS'];
$privateKey = $_ENV['PRIVATE_KEY'];
$adminAddress = $_ENV['ADMIN_ADDRESS'];

$web3 = new Web3(new HttpProvider(new HttpRequestManager($rpcUrl, 30)));
$contractABI = file_get_contents('contractABI.json');
$contract = new Contract($web3->provider, $contractABI);
$contract->at($contractAddress);

// Função para enviar transação assinada
function sendTransaction($functionData) {
    global $web3, $contractAddress, $privateKey, $adminAddress;
    
    $transaction = [
        'from' => $adminAddress,
        'to' => $contractAddress,
        'data' => $functionData,
        'gas' => '2000000'
    ];
    
    $web3->eth->sendTransaction($transaction, function ($err, $txHash) {
        if ($err !== null) {
            echo json_encode(['error' => $err->getMessage()]);
        } else {
            echo json_encode(['transactionHash' => $txHash]);
        }
    });
}

// Registrar um novo circuito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'requestCircuit') {
    $data = json_decode(file_get_contents("php://input"), true);
    $functionData = $contract->getData('requestCircuit', $data['source'], $data['destination'], $data['bandwidth'], $data['policyIds'], $data['policyNames'], $data['policyDescriptions'], $data['startTime'], $data['endTime'], $data['recurring'], $data['path']);
    sendTransaction($functionData);
}

// Aprovar um circuito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'approveCircuit') {
    $id = $_GET['id'];
    $functionData = $contract->getData('approveCircuit', $id);
    sendTransaction($functionData);
}

// Rejeitar um circuito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'rejectCircuit') {
    $id = $_GET['id'];
    $functionData = $contract->getData('rejectCircuit', $id);
    sendTransaction($functionData);
}

// Consultar um circuito
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'getCircuit') {
    $id = $_GET['id'];
    $contract->call('getCircuitRequest', $id, function ($err, $result) {
        if ($err !== null) {
            echo json_encode(['error' => $err->getMessage()]);
        } else {
            echo json_encode($result);
        }
    });
}
?>
