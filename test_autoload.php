<?php
require 'vendor/autoload.php';

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Dotenv\Dotenv;

echo "✅ Pacotes carregados corretamente!\n";

// Testar carregamento do .env
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔍 RPC_URL: " . $_ENV['RPC_URL'] . "\n";
echo "🔍 CONTRACT_ADDRESS: " . $_ENV['CONTRACT_ADDRESS'] . "\n";

// Criar instância Web3
$rpcUrl = $_ENV['RPC_URL'];
$web3 = new Web3(new HttpProvider($rpcUrl));

if ($web3) {
    echo "✅ Web3 carregado com sucesso!\n";
} else {
    echo "❌ Erro ao carregar Web3.\n";
}
?>
