<?php

namespace Core;

class Request
{
    //Encapsular informações de requisições http
    private $method;
    private $uri;
    private $params;

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->uri = $this->parseUri();
        $this->params = $this->method === 'GET' ? $_GET : $_POST;
    }

    private function parseUri(): string
    {
        $uri = $_SERVER['REQUEST_URI'];
        $pos = strpos($uri, '?');
        if ($pos !== false) {
            $uri = substr($uri, 0, $pos);
        }
        $uri = trim($uri, '/');
        return '/' . $uri;
    }

    //getters
    public function getMethod(): string
    {
        return $this->method;
    }

    public function getUri(): string
    {
        return $this->uri;
    }

    public function getParam(string $key, $default = null)
    {
        return $this->params[$key] ?? $default;
    }

    public function getAllParams(): array
    {
        return $this->params;
    }

    public function isPost(): bool
    {
        return $this->method === 'POST';
    }

    public function isGet(): bool
    {
        return $this->method === 'GET';
    }
}
