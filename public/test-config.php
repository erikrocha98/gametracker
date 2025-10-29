<?php

require_once __DIR__ . '/../src/Core/Config.php';

use GameTracker\Core\Config;

try {
    Config::load();
    
    echo "<h1>✅ Teste de Configurações</h1>";
    echo "<pre>";
    echo "APP_NAME: " . Config::get('APP_NAME') . "\n";
    echo "APP_ENV: " . Config::get('APP_ENV') . "\n";
    echo "DB_HOST: " . Config::get('DB_HOST') . "\n";
    echo "DB_DATABASE: " . Config::get('DB_DATABASE') . "\n";
    echo "DB_USERNAME: " . Config::get('DB_USERNAME') . "\n";
    echo "</pre>";
    
    echo "<p style='color: green;'>Config funcionando! ✓</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Erro: " . $e->getMessage() . "</p>";
}