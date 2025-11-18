<?php

namespace GameTracker\Models;

use GameTracker\Models\Interfaces\ModelInterface;
use PDO;

abstract class BaseModel implements ModelInterface
{
    protected PDO $pdo;
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function find(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function findAll(): array
    {
        $sql = "SELECT * FROM {$this->table}";
        $stmt = $this->pdo->query($sql);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        $fields = array_keys($data);
        $placeHolders = array_map(fn($field) => ":$field", $fields);

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $this->table,
            implode(', ', $fields),
            implode(', ', $placeHolders)
        );

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($data);

        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = array_keys($data);
        $setClause = implode(', ', array_map(fn($field) => "$field = :$field", $fields));

        $sql = "UPDATE {$this->table} SET $setClause WHERE {$this->primaryKey} = :id";

        $data['id'] = $id;
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute($data);
    }

    public function delete(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
        $stmt = $this->pdo->prepare($sql);

        return $stmt->execute(['id' => $id]);
    }

    public function findWhere(array $conditions): array
    {
        $fields = array_keys($conditions);
        $whereClause = implode(' AND ', array_map(fn($field) => "$field = :$field", $fields));

        $sql = "SELECT * FROM {$this->table} WHERE $whereClause";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function count(array $conditions = []): int
    {
        if (empty($conditions)) {
            $sql = "SELECT COUNT(*) as total FROM {$this->table}";
            $stmt = $this->pdo->query($sql);
        } else {
            $fields = array_keys($conditions);
            $whereClause = implode(' AND ', array_map(fn($field) => "$field = :$field", $fields));

            $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE $whereClause";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($conditions);
        }

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    public function exists(int $id): bool
    {
        $sql = "SELECT 1 FROM {$this->table} WHERE {$this->primaryKey} = :id LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);

        return $stmt->fetch() !== false;
    }
}