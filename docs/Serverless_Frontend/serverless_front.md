# Documentación para Replicar Continous Deploy Serverless en Frontend

Esta guía detalla los pasos necesarios para configurar el despliegue continuo de un frontend en un entorno serverless utilizando GitHub Actions y servicios de AWS como S3 y CloudFront.

## Prerrequisitos

- Cuenta en AWS con permisos para crear y gestionar servicios S3 y CloudFront.
- Repositorio en GitHub.

## Pasos Detallados

### 1. Configuración en AWS

### Crear y Configurar un Bucket S3

1. Navega a la consola de S3 en AWS.
2. Crea un nuevo bucket con el nombre que prefieras.
3. Asegúrate de habilitar las ACL (Access Control List) y permitir el tráfico público.

### Obtener Información del Bucket

- Guarda el nombre del bucket y la región donde fue creado. Estos valores se utilizarán como `S3_BUCKET_NAME` y `AWS_REGION`.

### Crear un Usuario IAM con Permisos Necesarios

1. Navega a la consola de IAM en AWS.
2. Crea un nuevo usuario IAM con las siguientes políticas adjuntas:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`

### Obtener Credenciales del Usuario IAM

1. Ve a la sección "Security Credentials" del usuario IAM creado.
2. Genera una nueva "Access Key" y guarda el `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`.

### Configurar CloudFront

1. Crea una nueva distribución en CloudFront apuntando al bucket S3 creado.
2. Guarda el ID de la distribución, que se utilizará como `CLOUDFRONT_DISTRIBUTION_ID`.

### 2. Configuración en GitHub

### Añadir Secrets en GitHub

1. Ve a tu repositorio en GitHub.
2. Navega a `Settings → Security → Secrets and Variables → Actions → New Repository Secret`.
3. Añade las siguientes secrets:
   - `S3_BUCKET_NAME`
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `CLOUDFRONT_DISTRIBUTION_ID`

### 3. Configuración del Workflow de GitHub Actions

### Actualizar el Archivo `main.yml`

Actualiza el archivo `.github/workflows/main.yml` con el siguiente contenido:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

  build-and-deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn ci

      - name: Build project
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy to S3
        run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete

      - name: Invalidate CloudFront cache
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

Este código hará un build del proyecto frontend, lo desplegará en S3 y posteriormente invalidará el caché de CloudFront.
