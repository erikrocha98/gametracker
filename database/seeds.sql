USE gametracker

-- Inserir usuários de teste
INSERT INTO usuarios (nome, username, email, password_hash) VALUES
('João Silva', 'joao_gamer', 'joao@test.com', '$2y$10$YourHashHere'),
('Maria Santos', 'maria_plays', 'maria@test.com', '$2y$10$YourHashHere');

-- Inserir alguns jogos
INSERT INTO games (titulo, sinopse, estimativa_horas, data_lancamento, developer, publisher, plataforma) VALUES
('The Witcher 3', 'RPG de mundo aberto', 100.0, '2015-05-19', 'CD Projekt Red', 'CD Projekt', 'PC'),
('Hades', 'Roguelike mitológico', 50.0, '2020-09-17', 'Supergiant', 'Supergiant', 'PC');

-- Adicionar jogos à biblioteca
INSERT INTO usuario_games (id_usuario, id_game, status) VALUES
(1, 1, 'played'),
(1, 2, 'to-play');

-- Adicionar uma review
INSERT INTO reviews (id_usuario, id_game, nota, texto_review) VALUES
(1, 1, 5, 'Um dos melhores RPGs que já joguei!');