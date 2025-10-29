<?php

require_once __DIR__ . '/../vendor/autoload.php';

use GameTracker\Core\Config;
use GameTracker\Core\Container;

Config::load();

echo "<h1>🧪 Teste do Container de Dependências</h1>";

// ========================================
// TESTE 1: Classe simples sem dependências
// ========================================
echo "<h2>Teste 1: Classe sem dependências</h2>";

class SimpleClass {
    public function sayHello() {
        return "Hello from SimpleClass!";
    }
}

try {
    $simple = Container::get(SimpleClass::class);
    echo "<p style='color: green;'>✓ SimpleClass criada: " . $simple->sayHello() . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
}

// ========================================
// TESTE 2: Singleton do PDO
// ========================================
echo "<h2>Teste 2: Singleton PDO</h2>";

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

try {
    $pdo1 = Container::get(\PDO::class);
    $pdo2 = Container::get(\PDO::class);
    
    echo "<p style='color: green;'>✓ PDO criado com sucesso!</p>";
    
    // Verifica se é a mesma instância (singleton)
    if ($pdo1 === $pdo2) {
        echo "<p style='color: green;'>✓ Singleton funcionando! (mesma instância)</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Não é singleton (instâncias diferentes)</p>";
    }
    
    // Testa query
    $stmt = $pdo1->query("SELECT DATABASE() as db");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p style='color: green;'>✓ Conectado ao banco: {$result['db']}</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
}

// ========================================
// TESTE 3: Classe com dependência simples
// ========================================
echo "<h2>Teste 3: Classe com dependência</h2>";

class Database {
    public function getConnection() {
        return "Conexão ativa";
    }
}

class UserRepository {
    private $database;
    
    public function __construct(Database $database) {
        $this->database = $database;
    }
    
    public function test() {
        return "UserRepository usando: " . $this->database->getConnection();
    }
}

try {
    $userRepo = Container::get(UserRepository::class);
    echo "<p style='color: green;'>✓ UserRepository criado com dependência automática!</p>";
    echo "<p style='color: green;'>✓ " . $userRepo->test() . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
}

// ========================================
// TESTE 4: Múltiplas dependências aninhadas
// ========================================
echo "<h2>Teste 4: Dependências aninhadas</h2>";

class Logger {
    public function log($message) {
        return "LOG: $message";
    }
}

class GameRepository {
    private $pdo;
    private $logger;
    
    public function __construct(\PDO $pdo, Logger $logger) {
        $this->pdo = $pdo;
        $this->logger = $logger;
    }
    
    public function test() {
        return $this->logger->log("GameRepository usando PDO: " . get_class($this->pdo));
    }
}

class GameService {
    private $repository;
    
    public function __construct(GameRepository $repository) {
        $this->repository = $repository;
    }
    
    public function test() {
        return "GameService > " . $this->repository->test();
    }
}

try {
    $gameService = Container::get(GameService::class);
    echo "<p style='color: green;'>✓ GameService criado com dependências aninhadas!</p>";
    echo "<p style='color: green;'>✓ " . $gameService->test() . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
}

// ========================================
// TESTE 5: Binding customizado
// ========================================
echo "<h2>Teste 5: Binding customizado</h2>";

interface CacheInterface {
    public function get($key);
}

class RedisCache implements CacheInterface {
    public function get($key) {
        return "Redis: valor de $key";
    }
}

// Registra a implementação concreta para a interface
Container::bind(CacheInterface::class, function() {
    return new RedisCache();
});

try {
    $cache = Container::get(CacheInterface::class);
    echo "<p style='color: green;'>✓ Interface resolvida para implementação concreta!</p>";
    echo "<p style='color: green;'>✓ " . $cache->get('test_key') . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
}

// ========================================
// RESUMO
// ========================================
echo "<hr>";
echo "<h2>📊 Resumo</h2>";
echo "<p>Se todos os testes passaram com ✓, seu Container está funcionando perfeitamente!</p>";