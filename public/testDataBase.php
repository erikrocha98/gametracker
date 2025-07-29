<?php
// Carregar autoload (vamos configurar depois)
require_once __DIR__ . '/../src/config/database.php';

use gametracker\config\database;

?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Teste PDO - GameTracker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
        }

        .success {
            color: green;
        }

        .error {
            color: red;
        }

        pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
        }
    </style>
</head>

<body>
    <h1>🔧 Teste de Conexão PDO</h1>

    <?php
    try {
        // Testar conexão
        $pdo = Database::getConnection();
        echo "<p class='success'>✅ Conexão estabelecida com sucesso!</p>";

        // Testar prepared statement - SELECT
        echo "<h2>1. Teste SELECT com Prepared Statement</h2>";
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = :email");
        $stmt->execute(['email' => 'joao@test.com']);
        $user = $stmt->fetch();

        if ($user) {
            echo "<p class='success'>✅ Usuário encontrado:</p>";
            echo "<pre>" . print_r($user, true) . "</pre>";
        }

        // Testar prepared statement - INSERT seguro
        echo "<h2>2. Teste INSERT com Prepared Statement</h2>";
        $stmt = $pdo->prepare("
            INSERT INTO games (titulo, sinopse, plataforma) 
            VALUES (:titulo, :sinopse, :plataforma)
        ");

        $novoJogo = [
            ':titulo' => 'Portal 2',
            ':sinopse' => 'Jogo de puzzle com portais',
            ':plataforma' => 'PC'
        ];

        if ($stmt->execute($novoJogo)) {
            $lastId = $pdo->lastInsertId();
            echo "<p class='success'>✅ Jogo inserido com ID: $lastId</p>";
        }

        // Testar transação
        echo "<h2>3. Teste de Transação</h2>";
        try {
            Database::beginTransaction();

            // Inserir um usuário
            $stmt = $pdo->prepare("
                INSERT INTO usuarios (nome, username, email, password_hash) 
                VALUES (:nome, :username, :email, :password)
            ");
            $stmt->execute([
                ':nome' => 'Teste Transaction',
                ':username' => 'teste_' . time(),
                ':email' => 'teste_' . time() . '@test.com',
                ':password' => password_hash('123456', PASSWORD_DEFAULT)
            ]);

            $userId = $pdo->lastInsertId();
            echo "<p>➡️ Usuário inserido com ID: $userId</p>";

            // Simular erro para testar rollback
            // throw new Exception("Erro simulado!");

            Database::commit();
            echo "<p class='success'>✅ Transação confirmada!</p>";
        } catch (Exception $e) {
            Database::rollback();
            echo "<p class='error'>❌ Transação revertida: " . $e->getMessage() . "</p>";
        }

        // Mostrar configurações PDO
        echo "<h2>4. Configurações PDO Ativas</h2>";
        $attributes = [
            'ATTR_ERRMODE' => [PDO::ATTR_ERRMODE, [
                PDO::ERRMODE_SILENT => 'SILENT',
                PDO::ERRMODE_WARNING => 'WARNING',
                PDO::ERRMODE_EXCEPTION => 'EXCEPTION'
            ]],
            'ATTR_DEFAULT_FETCH_MODE' => [PDO::ATTR_DEFAULT_FETCH_MODE, [
                PDO::FETCH_ASSOC => 'FETCH_ASSOC',
                PDO::FETCH_NUM => 'FETCH_NUM',
                PDO::FETCH_BOTH => 'FETCH_BOTH',
                PDO::FETCH_OBJ => 'FETCH_OBJ'
            ]],
            'ATTR_EMULATE_PREPARES' => [PDO::ATTR_EMULATE_PREPARES, [
                0 => 'Desabilitado',
                1 => 'Habilitado'
            ]],
            'MYSQL_ATTR_USE_BUFFERED_QUERY' => [PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, [
                0 => 'Desabilitado',
                1 => 'Habilitado'
            ]]
        ];

        echo "<table>";
        echo "<tr><th>Atributo</th><th>Valor</th><th>Significado</th></tr>";
        foreach ($attributes as $name => [$const, $meanings]) {
            try {
                $value = $pdo->getAttribute($const);
                $meaning = $meanings[$value] ?? $value;
                echo "<tr>
                        <td>$name</td>
                        <td>$value</td>
                        <td>$meaning</td>
                      </tr>";
            } catch (PDOException $e) {
                echo "<tr>
                        <td>$name</td>
                        <td colspan='2' style='color: red;'>Não suportado</td>
                      </tr>";
            }
        }
        echo "</table>";

        // Adicionar informações extras úteis
        echo "<h2>5. Informações da Conexão</h2>";
        echo "<table>";
        echo "<tr><th>Informação</th><th>Valor</th></tr>";

        // Versão do MySQL
        $version = $pdo->query("SELECT VERSION()")->fetchColumn();
        echo "<tr><td>Versão MySQL</td><td>$version</td></tr>";

        // Charset atual
        $charset = $pdo->query("SHOW VARIABLES LIKE 'character_set_connection'")->fetch();
        echo "<tr><td>Charset</td><td>{$charset['Value']}</td></tr>";

        // Timezone
        $timezone = $pdo->query("SELECT @@time_zone")->fetchColumn();
        echo "<tr><td>Timezone</td><td>$timezone</td></tr>";

        // Status da conexão
        echo "<tr><td>Status</td><td class='success'>Conectado</td></tr>";
        echo "</table>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Erro: " . $e->getMessage() . "</p>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
    ?>

    <h2>6. Exemplo de Uso em Models</h2>
    <pre><code>&lt;?php
// Em um Model futuro
class UserModel {
    private PDO $db;
    
    public function __construct() {
        $this->db = Database::getConnection();
    }
    
    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE email = :email");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch() ?: null;
    }
}
</code></pre>
</body>

</html>