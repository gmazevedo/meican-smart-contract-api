<?php
// Roteador para servidor embutido do PHP
$requestUri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$filePath = __DIR__ . $requestUri;

if ($requestUri === '/' || $requestUri === '') {
    // Redireciona para circuitRequest.php por padrão
    require_once __DIR__ . '/circuitRequest.php';
} elseif (file_exists($filePath) && !is_dir($filePath)) {
    return false;
} else {
    http_response_code(404);
    echo "404 - Página não encontrada";
}
