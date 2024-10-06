# Proyecto Backend - Grupo 14 Arquisis

## Información del Proyecto

Este proyecto se centra en la implementación del backend para el dominio `web.grupo14arquisis.me`. Aquí encontrarás detalles sobre las funcionalidades implementadas, la estructura de la base de datos y otros aspectos importantes del desarrollo.

## Consideraciones Generales

- En la base de datos, el arreglo `requests` asociado al modelo `User` contiene los `request_id` de las solicitudes generadas por el usuario.
-Se utilizó Node.js con Koa para desarrollar la API.
- La base de datos fue instanciada y conectada usando Sequelize como ORM. 
- IP de Instancia EC2: 52.71.13.245
- API Gateway: api.grupo14arquisis.me 

## Documentación de la API

### Endpoints

### Postgres

1. Inicializar psql: `sudo -u postgres psql`
2. Crear usuario de postgres `sudo -u postgres createuser --superuser [POSTGRES_USER]:`
3. Crear base de datos: `sudo -u postgres createdb [DB_NAME]`
4. Crear clave del usuario: `ALTER USER [POSTGRES_USER] WITH PASSWORD 'POSTGRES_PASSWORD';` (correr dentro del entorno de postgres)
5. Conectarse a la BD: `psql -U [POSTGRES_USER] -d [DB_NAME] -h`

### Dominio

- **Nombre del Dominio**: `web.grupo14arquisis.me`

### Entorno Local

#### Variables de entorno

1. Crear archivo `.env` dentro de carpeta `api` con las siguientes variables:
```
DB_USERNAME = <db_username>
DB_PASSWORD = <db_password>
DB_NAME = <db_name>
DB_HOST = localhost
REQUEST_URL = http://localhost:8000
API_URL = http://localhost:3000
VALIDATION_URL = http://localhost:9000
JOBS_MASTER_URL = http://localhost:4000
TEND_REDIRECT_URL = http://localhost:5173/purchaseCompleted
```
2. Crear archivo `.env` dentro de carpeta `listener` con las siguientes variables:
```
API_URL = http://localhost:3000
```
3. Crear archivo `.env` dentro de carpeta `requests` con las siguientes variables:
```
API_URL = http://localhost:3000
REQUEST_PORT = 8000
```
4. Crear archivo `.env` dentro de carpeta `validations` con las siguientes variables:
```
API_URL = http://localhost:3000
VALIDATION_PORT = 9000 
```
5. Crear archivo `.env` en la parte raíz del repositorio con las siguientes variables:
```
DB_USERNAME = <db_username>
DB_PASSWORD = <db_password>
DB_NAME = <db_name>
DB_HOST = db
```

#### Ejecución

Dentro de cada carpeta (`api`, `listener`, `requests`, `validations`) ejecutar los siguientes comandos:
1. Instalar dependencias: `yarn install` / `yarn`
2. Crear base de datos: `yarn sequelize-cli db:create`
3. Correr migraciones: `yarn sequelize-cli db:migrate`
4. Levantar servidores: `yarn start` / `yarn dev` 

### Docker

#### Variables de entorno

1. Crear archivo `.env` en la raíz del repositorio con las siguientes variables:
```
POSTGRES_USER = <db_username>
POSTGRES_PASSWORD = <db_password>
POSTGRES_DB = <db_name>
POSTGRES_HOST = db
TZ = "America/Santiago"
```
2. Modificar archivo `.env` dentro de carpeta `api` con las siguientes variables:
```
DB_USERNAME = <db_username>
DB_PASSWORD = <db_password>
DB_NAME = <db_name>
DB_HOST = db
REQUEST_URL = http://requests:3000
API_URL = http://api:3000
VALIDATION_URL = http://validations:9000
JOBS_MASTER_URL = http://jobs-master:4000
FRONTEND_REDIRECT_URL = http://localhost:5173/purchaseCompleted
```
3. Modificar archivo `.env` dentro de carpeta `listener` con las siguientes variables:
```
API_URL = http://api:3000
```
4. Modificar archivo `.env` dentro de carpeta `requests` con las siguientes variables:
```
API_URL = http://api:3000
REQUEST_PORT = 8000
```
5. Modificar archivo `.env` dentro de carpeta `validations` con las siguientes variables:
```
API_URL = http://api:3000
VALIDATION_PORT = 9000
```

#### Ejecución

(En caso de usar Ubuntu, se debe anteponer `sudo` a los siguientes comandos de docker)
1. Construir imagen: `docker compose build`
2. Levantar contenedores: `docker compose up -d`
3. Correr migraciones dentro del contenedor de la api: `docker compose exec api yarn sequelize-cli db:migrate`
4. Revisar contenedores: `docker compose ps`
5. Revisar logs: `docker compose logs`
6. Detener contenedores: `docker compose down`
7. Detener contendores y eliminar volúmenes: `docker compose down -v`

* También se pueden levantar los contenedores de forma individual con `docker compose up -d [service]` donde `[service]` puede ser `db`, `api`, `listener`, `requests`, `validations`. Recordar siempre levantar primero la base de datos antes que los otros servicios. Y correr las migraciones dentro del contenedor de la api.

## Conexión con Frontend (Local) 

### PARA EL GRUPO 11: creo que este es el plan para conectar backend y frontend, hablar el lunes. 

### Variables de entorno
Para establecer conexión entre el backend y el frontend, se debe crear un archivo `.env` en la raíz del proyecto de frontend con las siguientes variables:
```
REACT_APP_AUTH0_DOMAIN = <auth0_domain>
REACT_APP_AUTH0_CLIENT_ID = <auth0_client_id>
BACKEND_URL = <backend_url>
```

* `REACT_APP_AUTH0_DOMAIN` y `REACT_APP_AUTH0_CLIENT_ID` son las credenciales de autenticación de Auth0.
* `BACKEND_URL` es la URL del backend, en este caso `http://localhost:3000`.
* Si se conecta con el backend en producción, se debe cambiar `BACKEND_URL` por la URL `[INSERTAR URL DE BACKEND]`.

### Ejecución

1. Instalar dependencias: `yarn install` / `yarn`
2. Levantar servidor: `yarn start` / `yarn dev`

## Pipeline CI (GitHub Actions)

* Servicio a utilizar: CircleCI

## Puntos Logrados y No Logrados

### Puntos Logrados

- Implementación exitosa de la estructura de la base de datos.
