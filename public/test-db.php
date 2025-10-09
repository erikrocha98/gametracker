<?php

require_once __DIR__ . '/../src/Core/Config.php';

use Core\Config;

Config::load();

try {
    $dsn = sprintf(
        "mysql:host=%s;port=%s;dbname=%s;charset=%s",
        Config::get('DB_HOST'),
        Config::get('DB_PORT'),
        Config::get('DB_DATABASE'),
        Config::get('DB_CHARSET')
    );
    
    $pdo = new PDO(
        $dsn,
        Config::get('DB_USERNAME'),
        Config::get('DB_PASSWORD'),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "<h1>✅ Teste de Conexão com Banco</h1>";
    echo "<p style='color: green;'>Conexão estabelecida com sucesso! ✓</p>";
    
    // Testa uma query simples
    $stmt = $pdo->query("SELECT DATABASE() as db_name, VERSION() as version");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<pre>";
    echo "Banco conectado: " . $result['db_name'] . "\n";
    echo "Versão MySQL: " . $result['version'] . "\n";
    echo "</pre>";
    
    // Lista as tabelas
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>Tabelas encontradas:</h3>";
    if (count($tables) > 0) {
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li>$table</li>";
        }
        echo "</ul>";
    } else {
        echo "<p>Nenhuma tabela encontrada ainda.</p>";
    }
    
} catch (PDOException $e) {
    echo "<h1>❌ Erro de Conexão</h1>";
    echo "<p style='color: red;'>Erro: " . $e->getMessage() . "</p>";
}