# Documentación para Configurar Continuous Deployment Serverless en Backend

## 1. Configurar AWS CLI

Configura AWS CLI en tu entorno de desarrollo. Para más información sobre la instalación y configuración, consulta la [documentación oficial](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html).

## 2. Crear un Repositorio en Amazon ECR

1. Crea un nuevo repositorio en Amazon ECR. Asegúrate de que sea público, esté basado en Linux y permita todas las arquitecturas.
2. Para cada imagen de tu proyecto (Dockerfile), sigue los pasos indicados en Amazon ECR, específicamente en la sección de “View Push Commands”.

## 3. Subir Imágenes al Repositorio

Para subir cada imagen al repositorio, sigue estos pasos, asegurándote de cambiar el valor de `:latest` por el nombre de la imagen deseada. Por ejemplo, para la imagen `Api`:

```bash
docker tag grupo14arquisis:latest public.ecr.aws/e9p9x5g6/grupo14arquisis:Api
docker push public.ecr.aws/e9p9x5g6/grupo14arquisis:Api
```

## **4. Configurar Usuario IAM**

1. Crea un usuario IAM y obtén las “access keys” (AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY).
2. Coloca las access keys en GitHub: **`Settings → Security → Secrets and Variables → Actions → New Repository Secret`**.

### **Permisos para el Usuario IAM**

Asigna los siguientes permisos JSON al usuario IAM:

**Permiso para Obtener el Token de Autorización**

Asigna el rol creado a tu instancia EC2 en `Actions → Security → Modify IAM Role`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GetAuthorizationToken",
      "Effect": "Allow",
      "Action": [
        "ecr-public:GetAuthorizationToken",
        "sts:GetServiceBearerToken"
      ],
      "Resource": "*"
    }
  ]
}
```

**Permiso para Subir Imágenes**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPush",
      "Effect": "Allow",
      "Action": [
        "ecr-public:BatchCheckLayerAvailability",
        "ecr-public:CompleteLayerUpload",
        "ecr-public:InitiateLayerUpload",
        "ecr-public:PutImage",
        "ecr-public:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr-public::123456789012:repository/my-ecr-public-repo"
    }
  ]
}
```

## **5. Habilitar Docker en la Instancia**

Configura Docker en tu instancia para que se pueda ejecutar sin **`sudo`**. Sigue la guía en [Docker Post-Installation Steps](https://docs.docker.com/engine/install/linux-postinstall/).

## **6. Crear un Bucket en S3**

1. Crea un bucket en S3 con ACL deshabilitado y bloqueando todo el acceso público.
2. Guarda el nombre del bucket para usarlo más adelante.

### **Política de IAM para S3**

Crea una política de IAM con el siguiente JSON, reemplazando **`replace-with-your-s3-bucket-name`** por el nombre de tu bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:Get*", "s3:List*"],
      "Resource": [
        "arn:aws:s3:::replace-with-your-s3-bucket-name/*",
        "arn:aws:s3:::aws-codedeploy-us-east-2/*",
        "arn:aws:s3:::aws-codedeploy-us-east-1/*",
        "arn:aws:s3:::aws-codedeploy-us-west-1/*",
        "arn:aws:s3:::aws-codedeploy-us-west-2/*",
        "arn:aws:s3:::aws-codedeploy-ca-central-1/*",
        "arn:aws:s3:::aws-codedeploy-eu-west-1/*",
        "arn:aws:s3:::aws-codedeploy-eu-west-2/*",
        "arn:aws:s3:::aws-codedeploy-eu-west-3/*",
        "arn:aws:s3:::aws-codedeploy-eu-central-1/*",
        "arn:aws:s3:::aws-codedeploy-eu-central-2/*",
        "arn:aws:s3:::aws-codedeploy-eu-north-1/*",
        "arn:aws:s3:::aws-codedeploy-eu-south-1/*",
        "arn:aws:s3:::aws-codedeploy-eu-south-2/*",
        "arn:aws:s3:::aws-codedeploy-il-central-1/*"
      ]
    }
  ]
}
```

## **7. Crear un Rol IAM para EC2**

1. Crea un nuevo rol de IAM para EC2 con el servicio de AWS.
2. Asigna la política creada anteriormente y las siguientes políticas adicionales:

**Políticas Adicionales**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeRegions",
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:UpdateAutoScalingGroup",
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

**Permisos para CodeDeploy**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": ["codedeploy:*"],
      "Resource": ["*"]
    }
  ]
}
```

**Políticas AWS Adicionales**

- AmazonEC2RoleforAWSCodeDeploy
- AmazonSSMManagedInstanceCore
- AWSCodeDeployDeployerAccess
- AWSCodeDeployRole

**Trusted Relationships**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["codedeploy.amazonaws.com", "ec2.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## **8. Asignar Rol a la Instancia EC2**

Asigna el rol creado a tu instancia EC2 en `Actions → Security → Modify IAM Role`.

## 9. Crear una Aplicación en AWS CodeDeploy

1. Crea una aplicación en AWS CodeDeploy con computación basada en EC2.
2. Crea un grupo de despliegue y asigna el rol creado.
3. Selecciona la opción de In-Place, instancias de Amazon EC2 y agrega tu instancia.
4. Desmarca el balanceador de carga y selecciona la opción de CodeDeployDefaultAllAtOnce.

## 10. Crear Archivo appspec.yml

Sigue los pasos indicados en [AWS CodeDeploy Tutorials](https://docs.aws.amazon.com/codedeploy/latest/userguide/tutorials-on-premises-instance-2-create-sample-revision.html) para crear tu archivo `appspec.yml` y otros archivos necesarios.

## 11. Crear un Archivo .zip para S3

Crea un archivo `.zip` que contenga la carpeta de `scripts/`, `appspec.yml` y `docker-compose.production.yml`. Luego, sube este archivo `.zip` a tu bucket de S3.

## 12. Desplegar en AWS CodeDeploy

1. Ingresa a tu grupo de despliegue en AWS CodeDeploy.
2. Presiona la opción de `Create Deployment`.
3. Selecciona la opción de `My application is stored in S3` y agrega el enlace del archivo `.zip` en S3.
4. Selecciona la opción de `Don't fall the deployment to an instance if this lifecycle…` y `Overwrite the content`.

## 13. Crear Archivo build-and-push.yml

Crea un archivo `build-and-push.yml` en la carpeta `.github/workflows` de tu repositorio en GitHub, basado en el siguiente código:

```yaml
name: Build and Push to ECR

on:
  push:
    branches:
      - main
      - master

permissions:
  id-token: write  # Esto es requerido para solicitar el JWT
  contents: read  # Esto es requerido para actions/checkout

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    env:
      AWS_DEFAULT_REGION: us-east-1  # Región por defecto para ECR

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID0 }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY0 }}
          aws-region: ${{ env.AWS_DEFAULT_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr-public
        uses: aws-actions/amazon-ecr-login@v2
        with:
          registry-type: public
          mask-password: "true"

      - name: Build, tag, and push docker image to Amazon ECR Public (API)
        env:
          REGISTRY: ${{ steps.login-ecr-public.outputs.registry }}
          REGISTRY_ALIAS: e9p9x5g6
          REPOSITORY: grupo14arquisis
          IMAGE_TAG: api
        run: |
          cd api
        # Aquí se construye la imagen Docker para el servicio 'api'.
        # Si tienes otro servicio, cambia 'api' por el nombre del directorio correspondiente.
          docker build --platform linux/amd64 -t $REGISTRY/$REGISTRY_ALIAS/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REGISTRY_ALIAS/$REPOSITORY:$IMAGE_TAG

 # Repetir este bloque para todas las imágenes necesarias
 # Copia el bloque anterior y reemplaza 'api' por el nombre del directorio y 'IMAGE_TAG' adecuado para cada servicio.
 # Ejemplo para otro servicio:
      - name: Build, tag, and push docker image to Amazon ECR Public (Listener)
        env:
          REGISTRY: ${{ steps.login-ecr-public.outputs.registry }}
          REGISTRY_ALIAS: e9p9x5g6
          REPOSITORY: grupo14arquisis
          IMAGE_TAG: listener
        run: |
          cd listener
          docker build --platform linux/amd64 -t $REGISTRY/$REGISTRY_ALIAS/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REGISTRY_ALIAS/$REPOSITORY:$IMAGE_TAG

  deploy-to-ec2:
    runs-on: ubuntu-latest
    if: ${{ always() }}
    needs: [build-and-push]

    env:
      AWS_DEFAULT_REGION: us-east-2  # Región por defecto para CodeDeploy

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials for us-east-2
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID0 }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY0 }}
          aws-region: ${{ env.AWS_DEFAULT_REGION }}

      - name: Zip artifact to deploy
        run: |
          zip -r deploy.zip scripts/ appspec.yml docker-compose.production.yml
          # Añadir otros archivos necesarios para la implementación en el archivo zip

      - name: Copy Zip to S3
        run: |
          aws s3 cp deploy.zip s3://deploy-backend/deploy.zip --region ${{ env.AWS_DEFAULT_REGION }}
          # Cambia 'deploy-backend' por el nombre de tu bucket S3 específico

      - name: Create CodeDeploy Deployment
        id: create-deployment-trigger
        run: |
          deploymentId=$(aws deploy create-deployment --application-name \
          Backend-proyecto --deployment-group-name deploy-backend --region ${{ env.AWS_DEFAULT_REGION }} \
          --s3-location bucket=deploy-backend,key=deploy.zip,bundleType=zip \
          --description "Automatic deployment from githubactions commit ${{ github.sha }}" | jq -r '.deploymentId')
          echo "DeploymentId=$deploymentId" >> $GITHUB_OUTPUT
       # Cambia 'Backend-proyecto' por el nombre de tu aplicación en CodeDeploy
       # Cambia 'deploy-backend' por el nombre de tu grupo de implementación en CodeDeploy

      - name: Wait for deployment to finish
        run: |
          aws deploy wait deployment-successful --deployment-id ${{ steps.create-deployment-trigger.outputs.deploymentId }} --region ${{ env.AWS_DEFAULT_REGION }}
          # Espera hasta que la implementación sea exitosa, puedes ajustar esto según tus necesidades

```
