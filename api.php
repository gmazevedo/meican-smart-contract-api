<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Lê os dados recebidos
$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON, true);

if (!$data) {
    echo json_encode(["error" => "Dados inválidos"]);
    exit;
}

require "index.php"; // Certifique-se de que seu script de Web3 está corretamente importado

// Chamar a função de envio da transação (já implementada na API)
$response = sendTransaction(json_encode($data));

echo json_encode($response);
?>
