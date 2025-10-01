<?php

namespace gametracker\config;

use PDO;
use PDOException;

class DataBase
{
    private static ?PDO $connection = null;
    private static ?self $instance = null;

    //Configurações do banco
    private const DB_HOST = 'db';
    private const DB_NAME = 'gametracker';
    private const DB_USER = 'root';
    private const DB_PASS = 'secret';
    private const DB_CHARSET = 'utf8mb4';

    //Utilizando padrão singleton
    private function __construct() {}
    private function __clone() {}
    public function __wakeup()
    {
        throw new \Exception("Cannot unserialize singleton");
    }

    public static function getInstance(): self
    {
        if (self::$instance == null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    //Obtém e retorna a conexão PDO única
    public static function getConnection(): PDO
    {
        if (self::$connection == null) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=%s',
                    self::DB_HOST,
                    self::DB_NAME,
                    self::DB_CHARSET
                );
                self::$connection = new PDO(
                    $dsn,
                    self::DB_USER,
                    self::DB_PASS,
                    self::getOptions()
                );
            } catch (PDOException $e) {
                self::handleConnectionError($e);
            }
        }
        return self::$connection;
    }

    //Configura opções importantes do PDO
    private static function getOptions(): array
    {
        return [
            // Lançar exceções em caso de erro
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

            // Retornar arrays associativos por padrão
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            // Desabilitar emulação de prepared statements
            PDO::ATTR_EMULATE_PREPARES => false,

            // Usar buffered queries
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,

            // Definir charset e timezone
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '-03:00'"
        ];
    }

    //Método para lidar com erros de conexão
    private static function handleConnectionError(PDOException $e): void
    {
        $message = "Erro de conexão com o banco de dados: ";

        if ($_ENV['APP_ENV'] ?? 'development' === 'development') {
            die($message . $e->getMessage());
        }

        error_log($message . $e->getMessage());
        die("Erro ao conectar com o banco de dados. Por favor, tente novamente mais tarde.");
    }

    //Métodos de transação
    public static function closeConnection(): void
    {
        self::$connection = null;
    }

    public static function beginTransaction(): bool
    {
        return self::getConnection()->beginTransaction();
    }

    public static function commit(): bool
    {
        return self::getConnection()->commit();
    }

    public static function rollback(): bool
    {
        return self::getConnection()->rollBack();
    }

    public static function inTransaction(): bool
    {
        return self::getConnection()->inTransaction();
    }
}
