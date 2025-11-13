<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Core\Config;
use Core\Container;
use Models\User;

Config::load();

// Registra PDO no container
Container::singleton(\PDO::class, function() {
    $dsn = sprintf(
        "mysql:host=%s;port=%s;dbname=%s;charset=%s",
        Config::get('DB_HOST'),
        Config::get('DB_PORT'),
        Config::get('DB_DATABASE'),
        Config::get('DB_CHARSET')
    );
    
    return new \PDO(
        $dsn,
        Config::get('DB_USERNAME'),
        Config::get('DB_PASSWORD'),
        [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
    );
});

echo "<h1>🧪 Teste do Model Pattern</h1>";

try {
    // Cria instância do User Model
    $userModel = Container::get(User::class);
    
    echo "<h2>✅ User Model criado com sucesso!</h2>";
    
    // Verifica se implementa a interface
    if ($userModel instanceof \Interfaces\ModelInterface) {
        echo "<p style='color: green;'>✓ User implementa ModelInterface corretamente!</p>";
    }
    
    // Testa método count (não precisa de tabela para testar a estrutura)
    echo "<h3>Métodos disponíveis:</h3>";
    echo "<ul>";
    $methods = get_class_methods($userModel);
    foreach ($methods as $method) {
        if (!str_starts_with($method, '__')) {
            echo "<li>$method()</li>";
        }
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><strong>Nota:</strong> Para testar completamente, precisamos criar a tabela 'users' no banco.</p>";
