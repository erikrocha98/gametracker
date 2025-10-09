<?php

namespace Core;

class Router
{
    private $routes = [];

    public function get(string $path, string $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, string $handler)
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function addRoute(string $method, string $path, string $handler)
    {
        $this->routes[] = [
            'method'    => $method,
            'path'      => $path,
            'handler'   => $handler
        ];
    }

    //Busca a rota correta para uma dada requisição
    public function dispatch(Request $request): void {
        $requestMethod = $request->getMethod();
        $requestUri = $request->getUri();

        foreach ($this->routes as $route){
            if($route['method'] === $requestMethod && $this->matchPath($route['path'], $requestUri)){
                $this->callHandler($route['handler'], $request);
                return;
            }
        }
        http_response_code(404);
        echo "404, página não encontrada";
    }

    //Compara o caminho da rota com o caminho da requisição
    private function matchPath(string $routePath, string $requestUri): bool{
        return $routePath === $requestUri;
    }

    //transforma a string handler em execução do controller
    private function callHandler(string $handler, Request $request): void{
        list($controller, $method) = explode ('@', $handler);

        $controllerClass= "Controller\\$controller";

        if(!class_exists($controllerClass)){
            throw new \Exception("Controller $controllerClass não encontrado");
        }

        $controllerInstance = new $controllerClass();

        if(!method_exists($controllerInstance, $method)){
            throw new \Exception("Método $method não encontrado em $controllerClass");
        }

        $controllerInstance->$method($request);

    }
}
