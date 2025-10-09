<?php

require_once __DIR__ . '/../src/Core/Config.php';
require_once __DIR__ . '/../src/Core/Request.php';
require_once __DIR__ . '/../src/Core/Router.php';

use Core\Config;
use Core\Router;
use Core\Request;

Config::load();
session_start();

$request = new Request();
$router = new Router();

// Definir rotas de teste
$router->get('/', function() {
    echo "<h1>🏠 Página Inicial</h1>";
    echo "<p>Router funcionando!</p>";
    echo "<ul>";
    echo "<li><a href='/about'>Ir para About</a></li>";
    echo "<li><a href='/test'>Ir para Test</a></li>";
    echo "</ul>";
});

$router->get('/about', function() {
    echo "<h1>📄 Sobre</h1>";
    echo "<p>Esta é a página About</p>";
    echo "<a href='/'>Voltar</a>";
});

$router->get('/test', function() use ($request) {
    echo "<h1>🧪 Página de Teste</h1>";
    echo "<pre>";
    echo "Método: " . $request->getMethod() . "\n";
    echo "URI: " . $request->getUri() . "\n";
    echo "</pre>";
    echo "<a href='/'>Voltar</a>";
});

// Dispatch
$router->dispatch($request);