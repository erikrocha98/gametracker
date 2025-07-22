<?php
// Teste de conexão com o banco de dados
$host = 'db'; // nome do serviço no docker-compose
$dbname = 'gametracker';
$username = 'root';
$password = 'secret';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>✅ Conexão com banco de dados OK!</h1>";
    
    // Testar uma query simples
    $stmt = $pdo->query("SELECT VERSION() as version");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>MySQL Version: " . $result['version'] . "</p>";
    
} catch(PDOException $e) {
    echo "<h1>❌ Erro na conexão:</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}

// Verificar extensões PHP
echo "<h2>Extensões PHP carregadas:</h2>";
echo "<pre>";
print_r(get_loaded_extensions());
echo "</pre>";
