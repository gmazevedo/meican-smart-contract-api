<?php
// Roteador para servidor embutido do PHP
$requestUri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$filePath = __DIR__ . $requestUri;

if ($requestUri === '/' || $requestUri === '') {
    // Redireciona para index.php por padrão
    require_once __DIR__ . '/index.php';
} elseif (file_exists($filePath) && !is_dir($filePath)) {
    // Se o arquivo requisitado existe (HTML, JS, PHP), carrega normalmente
    return false;
} else {
    // Se o arquivo não existe, retorna 404
    http_response_code(404);
    echo "404 - Página não encontrada";
}
