<?php
// Configuração de erros para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Estilo CSS para deixar a página mais bonita
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste do Banco de Dados - GameTracker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .status-badge {
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.85em;
        }
        .played { background-color: #28a745; color: white; }
        .to-play { background-color: #ffc107; color: #333; }
        .rating {
            color: #ffc107;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 GameTracker - Teste do Banco de Dados</h1>
        
        <?php
        try {
            // Conexão com o banco
            $pdo = new PDO(
                "mysql:host=db;dbname=gametracker;charset=utf8mb4",
                "root",
                "secret",
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
            
            echo "<p class='success'>✅ Conexão com banco estabelecida com sucesso!</p>";
            
            // Verificar tabelas criadas
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            echo "<h2>📊 Tabelas criadas:</h2>";
            echo "<ul>";
            foreach ($tables as $table) {
                $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
                echo "<li><strong>$table</strong> - $count registro(s)</li>";
            }
            echo "</ul>";
            
            // Mostrar usuários
            echo "<h2>👥 Usuários</h2>";
            $usuarios = $pdo->query("SELECT * FROM usuarios")->fetchAll();
            if ($usuarios) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Nome</th><th>Username</th><th>Email</th><th>Criado em</th></tr>";
                foreach ($usuarios as $user) {
                    echo "<tr>";
                    echo "<td>{$user['id_usuario']}</td>";
                    echo "<td>{$user['nome']}</td>";
                    echo "<td>@{$user['username']}</td>";
                    echo "<td>{$user['email']}</td>";
                    echo "<td>" . date('d/m/Y H:i', strtotime($user['created_at'])) . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
            
            // Mostrar jogos
            echo "<h2>🎯 Jogos</h2>";
            $games = $pdo->query("SELECT * FROM games")->fetchAll();
            if ($games) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Título</th><th>Sinopse</th><th>Horas</th><th>Lançamento</th><th>Developer</th><th>Plataforma</th></tr>";
                foreach ($games as $game) {
                    echo "<tr>";
                    echo "<td>{$game['id_game']}</td>";
                    echo "<td><strong>{$game['titulo']}</strong></td>";
                    echo "<td>{$game['sinopse']}</td>";
                    echo "<td>{$game['estimativa_horas']}h</td>";
                    echo "<td>" . date('d/m/Y', strtotime($game['data_lancamento'])) . "</td>";
                    echo "<td>{$game['developer']}</td>";
                    echo "<td>{$game['plataforma']}</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
            
            // Mostrar biblioteca dos usuários
            echo "<h2>📚 Biblioteca dos Usuários</h2>";
            $biblioteca = $pdo->query("
                SELECT 
                    u.nome as usuario,
                    g.titulo as jogo,
                    ug.status,
                    ug.data_adicao,
                    ug.data_conclusao
                FROM usuario_games ug
                JOIN usuarios u ON u.id_usuario = ug.id_usuario
                JOIN games g ON g.id_game = ug.id_game
                ORDER BY u.nome, ug.data_adicao DESC
            ")->fetchAll();
            
            if ($biblioteca) {
                echo "<table>";
                echo "<tr><th>Usuário</th><th>Jogo</th><th>Status</th><th>Adicionado em</th><th>Concluído em</th></tr>";
                foreach ($biblioteca as $item) {
                    $statusClass = $item['status'] == 'played' ? 'played' : 'to-play';
                    $statusText = $item['status'] == 'played' ? 'Jogado' : 'Jogar';
                    
                    echo "<tr>";
                    echo "<td>{$item['usuario']}</td>";
                    echo "<td>{$item['jogo']}</td>";
                    echo "<td><span class='status-badge {$statusClass}'>{$statusText}</span></td>";
                    echo "<td>" . date('d/m/Y', strtotime($item['data_adicao'])) . "</td>";
                    echo "<td>" . ($item['data_conclusao'] ? date('d/m/Y', strtotime($item['data_conclusao'])) : '-') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
            
            // Mostrar reviews
            echo "<h2>⭐ Reviews</h2>";
            $reviews = $pdo->query("
                SELECT 
                    u.nome as usuario,
                    g.titulo as jogo,
                    r.nota,
                    r.texto_review,
                    r.created_at
                FROM reviews r
                JOIN usuarios u ON u.id_usuario = r.id_usuario
                JOIN games g ON g.id_game = r.id_game
                ORDER BY r.created_at DESC
            ")->fetchAll();
            
            if ($reviews) {
                echo "<table>";
                echo "<tr><th>Usuário</th><th>Jogo</th><th>Nota</th><th>Review</th><th>Data</th></tr>";
                foreach ($reviews as $review) {
                    $stars = str_repeat('⭐', $review['nota']);
                    
                    echo "<tr>";
                    echo "<td>{$review['usuario']}</td>";
                    echo "<td>{$review['jogo']}</td>";
                    echo "<td><span class='rating'>{$stars}</span> ({$review['nota']}/5)</td>";
                    echo "<td>{$review['texto_review']}</td>";
                    echo "<td>" . date('d/m/Y H:i', strtotime($review['created_at'])) . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
            
            // Estatísticas
            echo "<h2>📈 Estatísticas</h2>";
            $stats = $pdo->query("
                SELECT 
                    COUNT(DISTINCT u.id_usuario) as total_usuarios,
                    COUNT(DISTINCT g.id_game) as total_jogos,
                    COUNT(DISTINCT ug.id_usuario, ug.id_game) as total_biblioteca,
                    COUNT(DISTINCT r.id_review) as total_reviews
                FROM usuarios u
                CROSS JOIN games g
                LEFT JOIN usuario_games ug ON 1=1
                LEFT JOIN reviews r ON 1=1
            ")->fetch();
            
            echo "<ul>";
            echo "<li>Total de usuários: <strong>{$stats['total_usuarios']}</strong></li>";
            echo "<li>Total de jogos cadastrados: <strong>{$stats['total_jogos']}</strong></li>";
            echo "<li>Jogos em bibliotecas: <strong>{$stats['total_biblioteca']}</strong></li>";
            echo "<li>Reviews escritas: <strong>{$stats['total_reviews']}</strong></li>";
            echo "</ul>";
            
        } catch (PDOException $e) {
            echo "<p class='error'>❌ Erro na conexão: " . $e->getMessage() . "</p>";
            echo "<pre>" . $e->getTraceAsString() . "</pre>";
        }
        ?>
        
        <hr style="margin-top: 40px;">
        <p style="text-align: center; color: #666;">
            GameTracker Test Page - <?= date('d/m/Y H:i:s') ?>
        </p>
    </div>
</body>
</html>