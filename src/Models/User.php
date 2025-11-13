<?php

namespace GameTracker\Models;

class User extends BaseModel
{
    protected string $table = 'users';
    /**
     * Busca usuário por email
     */
    public function findByEmail(string $email): ?array
    {
        $sql = "SELECT *FROM {$this->table} WHERE email = :$email LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    /**
     * Verifica se o email já existe
     */
    public function emailExists(string $email): bool
    {
        $sql = "SELECT 1 FROM {$this->table} WHERE email = :email LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        return $stmt->fetch() !== false;
    }
}
