CREATE DATABASE IF NOT EXISTS gametracker;
USE gametracker;

-- Tabela simples para teste
CREATE TABLE IF NOT EXISTS test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de teste
INSERT INTO test (message) VALUES ('Ambiente Docker funcionando!');