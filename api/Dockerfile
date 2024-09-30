FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo los archivos de dependencias primero
COPY package*.json ./

# Instala las dependencias
RUN yarn install

# Copia solo el contenido de la carpeta src
COPY . .

# Expone el puerto
EXPOSE 3000

# Comando por defecto para ejecutar la aplicación
CMD ["yarn", "start"]