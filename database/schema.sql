DROP DATABASE IF EXISTS gametracker;
CREATE DATABASE gametracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gametracker;

/* -- Tabela simples para teste
CREATE TABLE IF NOT EXISTS test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de teste
INSERT INTO test (message) VALUES ('Ambiente Docker funcionando!'); */

--tabela usuários
CREATE TABLE usuarios(
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR (100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR (255) UNIQUE NOT NULL,
    avatar_url VARCHAR (255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Jogos
CREATE TABLE games (
    id_game INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    sinopse TEXT,
    estimativa_horas DECIMAL(5,1),
    data_lancamento DATE,
    developer VARCHAR(255),
    publisher VARCHAR(255),
    cover_url VARCHAR(255),
    plataforma VARCHAR(100),
    api_id INT UNIQUE,
    api_source VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_titulo (titulo),
    INDEX idx_api (api_id, api_source)
);

--tabela composta usuario_games
CREATE TABLE usuario_games (
    id_usuario INT NOT NULL,
    id_game INT NOT NULL,
    PRIMARY KEY (id_usuario, id_game),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_game) REFERENCES games(id_game) ON DELETE CASCADE,
    status ENUM ('played', 'to-play') NOT NULL,
    data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_data_conclusao (data_conclusao)

);

--tabela de reviews
CREATE TABLE reviews (
    id_review INT PRIMARY KEY AUTO_INCREMENT,
    nota INT NOT NULL CHECK (nota >= 0 AND nota <= 5),
    texto_review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_game (id_usuario, id_game),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_game) REFERENCES games(id_game) ON DELETE CASCADE,
    INDEX idx_nota (nota),
    INDEX idx_created (created_at)
);