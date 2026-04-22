# 🔧 Mechin — Plataforma de Servicios Automotrices

> **"Tu mecánico de confianza, donde lo necesites."**

Mechin es una plataforma web tipo marketplace que conecta clientes con mecánicos certificados y tiendas de repuestos en la ciudad de Manizales. Funciona de forma similar a Rappi o Uber, actuando como intermediario y garantizando transparencia en precios, calificaciones y trazabilidad de servicios.

---

## 📋 Tabla de contenidos

- [Requisitos previos](#-requisitos-previos)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Configuración de la base de datos](#-configuración-de-la-base-de-datos)
- [Configuración del archivo .env](#-configuración-del-archivo-env)
- [Cómo levantar el proyecto](#-cómo-levantar-el-proyecto)
- [Verificar que todo funciona](#-verificar-que-todo-funciona)
- [Solución de problemas comunes](#-solución-de-problemas-comunes)

---

## ✅ Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina:

| Herramienta | Versión recomendada | Descarga |
|-------------|--------------------:|---------|
| Node.js | v18 o superior | https://nodejs.org |
| PostgreSQL | v14 o superior | https://www.postgresql.org/download |
| Git | Cualquier versión reciente | https://git-scm.com |
| VS Code | Cualquier versión reciente | https://code.visualstudio.com |

> 💡 **Tip:** Para verificar que Node.js y PostgreSQL están instalados, abre una terminal y ejecuta `node -v` y `psql --version`. Si te muestran un número de versión, están correctamente instalados.

---

## 📁 Estructura del proyecto

```
Mechin_Software/
├── Backend/                        # Servidor Node.js + Express
│   ├── src/
│   │   ├── config/                 # Configuración de BD y CORS
│   │   ├── middlewares/            # Autenticación, roles, validaciones
│   │   ├── modules/                # Módulos por funcionalidad
│   │   │   ├── auth/               # Registro, login, recuperación
│   │   │   ├── users/              # Gestión de usuarios
│   │   │   ├── mechanics/          # Perfiles de mecánicos
│   │   │   └── ...
│   │   └── utils/
│   │       └── init.sql            # Script de creación de la BD
│   ├── .env.example                # Plantilla del archivo .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js                   # Punto de entrada del backend
│
├── Frontend/                       # Aplicación React + Vite
│   ├── src/
│   │   ├── pages/                  # Páginas de la app
│   │   ├── components/             # Componentes reutilizables
│   │   ├── services/               # Llamadas a la API
│   │   ├── context/                # Estado global (AuthContext)
│   │   └── router/                 # Rutas de la aplicación
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🗄️ Configuración de la base de datos

### Paso 1 — Instalar la extensión de PostgreSQL en VS Code

Abre VS Code, ve al panel de extensiones (`Ctrl + Shift + X`) y busca **"PostgreSQL"** de **Chris Kolkman**. Instálala.

### Paso 2 — Crear la base de datos

1. En VS Code, haz clic en el ícono de la extensión PostgreSQL en la barra lateral izquierda (ícono de elefante 🐘)
2. Haz clic en **"Add Connection"** y completa los campos así:

```
Connection name:   Mechin Local
Server Address:    localhost
Port:              5432
Database:          postgres
Username:          postgres
Password:          [tu contraseña de PostgreSQL]
```

3. Una vez conectado, haz clic derecho sobre la conexión → **"New Query"**
4. Escribe y ejecuta:

```sql
CREATE DATABASE mechin_db;
```

5. Verás el mensaje `CREATE successfully executed`

### Paso 3 — Conectarse a `mechin_db`

Crea una nueva conexión apuntando directamente a `mechin_db`:

```
Connection name:   Mechin DB
Server Address:    localhost
Port:              5432
Database:          mechin_db
Username:          postgres
Password:          [tu contraseña de PostgreSQL]
```

### Paso 4 — Ejecutar el script de creación de tablas

1. En VS Code, abre el archivo `Backend/src/utils/init.sql`
2. Selecciona todo el contenido con `Ctrl + A`
3. Haz clic derecho → **"Run Query"** (asegúrate de estar conectado a `mechin_db`)
4. Verás mensajes indicando que las tablas, índices y datos semilla fueron creados

> ✅ El script es **idempotente** — puedes ejecutarlo múltiples veces sin error. Si una tabla o dato ya existe, simplemente lo omite.

### Paso 5 — Verificar que las tablas se crearon

Ejecuta este query para confirmar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver las siguientes tablas:

```
calificaciones
cancelaciones_servicio
categorias_repuesto
comentarios
disponibilidad_mecanico
especialidades
estadisticas_sistema
estados_servicio
logs_acceso
mecanico_especialidades
notificaciones
pagos
perfiles_mecanico
recuperacion_contrasena
repuestos
reportes_incidencias
roles
servicios
tiendas
transacciones
usuarios
usuarios_roles
validaciones_solicitud
```

Y para verificar que los roles se insertaron correctamente:

```sql
SELECT * FROM roles;
```

Deberías ver 4 filas: `cliente`, `mecanico`, `tienda`, `administrador`.


### Paso 1 — Crear el archivo

Dentro de la carpeta `Backend/`, crea un archivo llamado exactamente `.env` (con el punto al inicio, sin extensión adicional).

### Paso 2 — Pegar y ajustar el contenido

```env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD="tu_contraseña_aqui"
DB_NAME=mechin_db
DB_PORT=5432
JWT_SECRET=mechin_super_secret_jwt_key_2026
```

> 💡 **Nota sobre la contraseña:** Si tu contraseña de PostgreSQL contiene caracteres especiales como `#`, `@`, `!`, etc., **es obligatorio ponerla entre comillas dobles** como se muestra arriba. De lo contrario, el `#` se interpretará como inicio de comentario y la contraseña quedará truncada.

**Ejemplo correcto:**
```env
DB_PASSWORD="mi#contraseña@segura"
```

**Ejemplo incorrecto:**
```env
DB_PASSWORD=mi#contraseña@segura   ← el # corta la contraseña aquí
```

---

## 🚀 Cómo levantar el proyecto

Necesitas **dos terminales abiertas al mismo tiempo** — una para el backend y otra para el frontend.

### Terminal 1 — Backend

```bash
cd Backend
npm install
npm start
```

Si todo está bien, verás:
```
Server started on port 5000
Connected to PostgreSQL Database
```

> El servidor backend corre en **http://localhost:5000**

### Terminal 2 — Frontend

```bash
cd Frontend
npm install
npm run dev
```

Si todo está bien, verás:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

> La interfaz web corre en **http://localhost:5173**

---

## ✔️ Verificar que todo funciona

Una vez que ambas terminales estén corriendo, puedes verificar la conexión a la base de datos abriendo en tu navegador:

```
http://localhost:5000/api/health
```

Deberías ver una respuesta como esta:

```json
{
  "status": "✅ Conexión exitosa",
  "base_de_datos": "mechin_db",
  "hora_servidor": "2026-04-22T..."
}
```

Si ves esto, **el backend está conectado correctamente a la base de datos** y el proyecto está listo para usarse.

---

## 🛠️ Solución de problemas comunes

### ❌ `password authentication failed for user "postgres"`
La contraseña en tu `.env` es incorrecta o tiene caracteres especiales sin comillas.
→ Verifica que `DB_PASSWORD` esté entre comillas dobles si tiene `#`, `@`, `!`, etc.

### ❌ `database "mechin_db" does not exist`
La base de datos no fue creada.
→ Regresa al [Paso 2](#paso-2--crear-la-base-de-datos) y crea la BD.

### ❌ `no existe la relación «usuarios»`
El script `init.sql` no se ejecutó o se ejecutó en la base de datos equivocada.
→ Asegúrate de estar conectado a `mechin_db` y vuelve a ejecutar el `init.sql`.

### ❌ `connect ECONNREFUSED 127.0.0.1:5432`
PostgreSQL no está corriendo en tu máquina.
→ Abre el panel de servicios de Windows (`services.msc`), busca **postgresql** y asegúrate de que esté en estado **"En ejecución"**.

### ❌ `Cannot GET /api/health`
El backend no está corriendo o se detuvo.
→ Revisa la Terminal 1 y vuelve a ejecutar `npm start`.

---

## 👥 Equipo de desarrollo

Proyecto desarrollado como parte del curso de Ingeniería de Software.
Stack: **React + Node.js + PostgreSQL**