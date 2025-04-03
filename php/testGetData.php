<?php
require __DIR__ . '/../vendor/autoload.php';

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;

$web3 = new Web3(new HttpProvider('http://localhost:8545')); // ou seu RPC
$abi = file_get_contents(__DIR__ . '/../ABI/FileRegistryABI.json');
$contract = new Contract($web3->provider, $abi);
$contract->at('0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7');

$hash = '0x' . hash('sha256', 'teste');

$contract->getData('registerFileHash', $hash, function ($err, $data) {
    if ($err !== null) {
        echo "❌ Erro: " . $err->getMessage() . "\n";
    } else {
        echo "✅ getData OK: " . $data . "\n";
    }
});
