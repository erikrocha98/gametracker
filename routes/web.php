<?php

// Rotas públicas
$router->get('/', 'HomeController@index');
$router->get('/login', 'AuthController@showLogin');
$router->post('/login', 'AuthController@login');
$router->get('/register', 'AuthController@showRegister');
$router->post('/register', 'AuthController@register');
$router->get('/logout', 'AuthController@logout');

// Rotas de jogos (protegidas depois)
$router->get('/games', 'GameController@index');
$router->get('/games/create', 'GameController@create');
$router->post('/games', 'GameController@store');
$router->get('/games/edit', 'GameController@edit');
$router->post('/games/update', 'GameController@update');
$router->post('/games/delete', 'GameController@delete');