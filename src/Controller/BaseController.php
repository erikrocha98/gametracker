<?php

namespace GameTracker\Controller;

use GameTracker\Core\Request;
use GameTracker\Core\Response;

abstract class BaseController {
    protected Request $request;
    protected Response $response;

    public function __construct(Request $request, Response $response)
    {
        $this->request = $request;
        $this->response = $response;
    }

    /**
     * Retorna resposta JSON de sucesso
     */
    protected function success (array $data=[], string $message ='', int $statusCode=200):void{
        $this->response->json([
            'success'=>true,
            'message'=>$message,
            'data'=> $data
        ], $statusCode);
    }

    /**
     * Retorna resposta JSON de erro
     */

    /**
     * Retorna JSON personalizado
     */

    /**
     * Valida se o usuário está autenticado
     */

    /**
     * Retorna o ID do usuário autenticado
     */

    /**
     * Retorna os dados do usuário autenticado
     */

    /**
     * Valida dados da requisição
     */
}