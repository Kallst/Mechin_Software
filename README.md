# Mechin_Software
Este es el repositorio de la codificación de Mechin, un software pensado para los mecánicos.

---

1. Base de Datos (PostgreSQL)
Necesitan tener instalado el PostgreSQL
2. Creen una base de datos llamada "mechin_db"
3. Ejecuten el script SQL que esta en `Backend/src/utils/init.sql`. este script ya les crea todas las tablas y roles

IMPORTANTE!!! El archivo .env es diferente para cada persona. Este archivo contiene configuraciones como contraseña de la base de datos por lo que NUNCA lo suban a Git ya debe andar en el .gitignore Cada uno debe crear el suyo

En la carpeta Backend creen un archivo `.env` y peguen esto cambiando bviamente por sus datos de la bd


PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=contraseña_aqui
DB_NAME=mechin_db
DB_PORT=5432
JWT_SECRET=mechin_super_secret_jwt_key_2026




para levantar el proyecto se Necesitan dos terminales abiertas

1. terminal Backend
cd Backend
npm install
npm start

El servidor corre en http://localhost:5000.

2. terminal Frontend
cd Frontend
npm install
npm run dev
La interfaz correrá en http://localhost:5173.
