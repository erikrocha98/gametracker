<?php

namespace GameTracker\Models\Interfaces;

interface ModelInterface
{
    /**
     * Busca um registro por ID
     * 
     * @param int $id
     * @return array|null
     */
    public function find(int $id): ?array;

    /**
     * Busca todos os registros
     * 
     * @return array
     */
    public function findAll(): ?array;

    /**
     * Cria um novo registro
     * 
     * @param array $data
     * @return int ID do registro criado
     */
    public function create(array $data): int;

    /**
     * Atualiza um registro existente
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool;

    /**
     * Deleta um registro
     * 
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * Busca registros com condições
     * 
     * @param array $conditions Ex: ['status' => 'active', 'user_id' => 1]
     * @return array
     */
    public function findWhere(array $conditions): array;

    /**
     * Conta total de registros
     * 
     * @param array $conditions (opcional)
     * @return int
     */
    public function count(array $conditions): int;

    /**
     * Verifica se um registro existe
     * 
     * @param int $id
     * @return bool
     */
    public function exists(int $id): bool;
}
