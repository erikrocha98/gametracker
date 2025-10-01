<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Core\Config;
use Core\Router;
use Core\Request;

Config::load();

session_start();

$request = new Request();
$router = new Router();

require_once __DIR__ . '/../routes/web.php';

$router->dispatch($request);
