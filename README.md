# Proyecto Backend - Grupo 14 Arquisis

## Información del Proyecto

Este proyecto se centra en la implementación del backend para el dominio `grupo14arquisis.me`. Aquí encontrarás detalles sobre las funcionalidades implementadas, la estructura de la base de datos y otros aspectos importantes del desarrollo.

### Consideraciones Generales

- En la base de datos, el arreglo `requests` asociado al modelo `User` contiene los `request_id` de las solicitudes generadas por el usuario.
-Se utilizó Node.js con Koa para desarrollar la API.
- La base de datos fue instanciada y conectada usando Sequelize como ORM. 
- URL de Instancia EC2:
- URL de API Gateway:
- URL de frontend: 

## Endpoints

## Postgres

1. Inicializar psql: `sudo -u postgres psql`
2. Crear usuario de postgres `sudo -u postgres createuser --superuser [POSTGRES_USER]:`
3. Crear base de datos: `sudo -u postgres createdb [DB_NAME]`
4. Crear clave del usuario: `ALTER USER [POSTGRES_USER] WITH PASSWORD 'POSTGRES_PASSWORD';` (correr dentro del entorno de postgres)
5. Conectarse a la BD: `psql -U [POSTGRES_USER] -d [DB_NAME] -h`

### Dominio

- **Nombre del Dominio**: `grupo14arquisis.me`

## Puntos Logrados y No Logrados

### Puntos Logrados

- Implementación exitosa de la estructura de la base de datos.

### Puntos No Logrados
