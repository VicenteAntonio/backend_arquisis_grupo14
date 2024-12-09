#!/bin/bash

echo "Aplication starting"
cd /home/ubuntu/backend_arquisis_grupo_14
docker compose --file docker-compose.production.yml up -d