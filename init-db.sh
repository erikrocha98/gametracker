#!/bin/bash
echo "Iniciando containers..."
docker-compose up -d db

echo "Aguardando MySQL iniciar..."
sleep 10

echo "Executando scripts SQL..."
docker-compose exec -T db mysql -uroot -psecret gametracker < database/schema.sql
docker-compose exec -T db mysql -uroot -psecret gametracker < database/seeds.sql

echo "Iniciando aplicação..."
docker-compose up -d

echo "✅ Ambiente pronto!"