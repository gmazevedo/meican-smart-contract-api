<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/api.log');

// Lê os dados recebidos
$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON, true);

if (!$data) {
    echo json_encode(["error" => "Dados inválidos"]);
    exit;
}

require "index.php"; // Certifique-se de que seu script de Web3 está corretamente importado

// Chamar a função de envio da transação
prepareData(json_encode($data));

?>
