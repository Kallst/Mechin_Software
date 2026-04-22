# 🔧 Mechin — Plataforma de Servicios Automotrices

> **"Tu mecánico de confianza, donde lo necesites."**

Mechin es una plataforma web tipo marketplace que conecta clientes con mecánicos certificados y tiendas de repuestos en la ciudad de Manizales. Funciona de forma similar a Rappi o Uber, actuando como intermediario y garantizando transparencia en precios, calificaciones y trazabilidad de servicios.

**Stack:** React + Node.js + PostgreSQL

---

## 📋 Tabla de contenidos

1. [Requisitos previos](#-1-requisitos-previos)
2. [Clonar el proyecto](#-2-clonar-el-proyecto)
3. [Configurar la base de datos](#-3-configurar-la-base-de-datos)
4. [Configurar el archivo .env](#-4-configurar-el-archivo-env)
5. [Instalar dependencias y levantar el proyecto](#-5-instalar-dependencias-y-levantar-el-proyecto)
6. [Verificar que todo funciona](#-6-verificar-que-todo-funciona)
7. [Solución de problemas comunes](#-7-solución-de-problemas-comunes)

---

## ✅ 1. Requisitos previos

Antes de comenzar, instala las siguientes herramientas en tu máquina. Haz clic en cada enlace para descargarlas:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js | v18 o superior | https://nodejs.org |
| PostgreSQL | v14 o superior | https://www.postgresql.org/download |
| Git | Cualquier versión | https://git-scm.com |
| VS Code | Cualquier versión | https://code.visualstudio.com |

**¿Cómo verificar que están instalados?** Abre una terminal y ejecuta:

```bash
node -v        # Debe mostrar algo como: v18.x.x
psql --version # Debe mostrar algo como: psql (PostgreSQL) 14.x
git --version  # Debe mostrar algo como: git version 2.x.x
```

Si alguno muestra un error en lugar de un número de versión, significa que no está instalado correctamente.

---

## 📥 2. Clonar el proyecto

Abre una terminal, navega a la carpeta donde quieres guardar el proyecto y ejecuta:

```bash
git clone <https://github.com/Kallst/Reserva-Deportiva.git>
cd Mechin_Software
```

---

## 🗄️ 3. Configurar la base de datos

Sigue estos pasos en orden. No te saltes ninguno.

### Paso 3.1 — Instalar la extensión de PostgreSQL en VS Code

1. Abre VS Code
2. Presiona `Ctrl + Shift + X` para abrir el panel de extensiones
3. Busca **PostgreSQL** de **Chris Kolkman**
4. Haz clic en **Instalar**

### Paso 3.2 — Conectar VS Code a PostgreSQL

1. En la barra lateral izquierda de VS Code aparecerá el ícono del elefante 🐘 — haz clic en él
2. Haz clic en **"Add Connection"**
3. Completa los campos exactamente así:

```
Connection name:   Mechin Local
Server Address:    localhost
Port:              5432
Database:          postgres
Username:          postgres
Password:          [la contraseña que pusiste al instalar PostgreSQL]
```

4. Haz clic en **Connect** — si los datos son correctos verás la conexión en la lista

### Paso 3.3 — Crear la base de datos

1. Haz clic derecho sobre la conexión que acabas de crear
2. Selecciona **"New Query"**
3. Escribe el siguiente comando y presiona `F5` para ejecutarlo:

```sql
CREATE DATABASE mechin_db;
```

4. Verás el mensaje `CREATE successfully executed` — esto confirma que la BD fue creada

### Paso 3.4 — Conectarse a `mechin_db`

Ahora necesitas crear una segunda conexión que apunte directamente a `mechin_db`:

1. Haz clic en **"Add Connection"** nuevamente
2. Completa los campos así (el único cambio es el campo Database):

```
Connection name:   Mechin DB
Server Address:    localhost
Port:              5432
Database:          mechin_db
Username:          postgres
Password:          [tu contraseña de PostgreSQL]
```

3. Haz clic en **Connect**

> ⚠️ **Importante:** A partir de aquí, asegúrate siempre de ejecutar los queries en la conexión **Mechin DB** y no en **Mechin Local**.

### Paso 3.5 — Ejecutar el script de creación de tablas

1. En VS Code, abre el archivo `Backend/src/utils/init.sql`
2. Selecciona todo el contenido con `Ctrl + A`
3. Haz clic derecho sobre el texto seleccionado
4. Selecciona **"Run Query"**
5. Asegúrate de que en la esquina inferior derecha diga **Mechin DB** antes de ejecutar

Verás una serie de mensajes confirmando que las tablas, índices y datos semilla fueron creados correctamente.

> ✅ El script es **idempotente** — puedes ejecutarlo múltiples veces sin error. Si una tabla ya existe, simplemente la omite.

### Paso 3.6 — Verificar que las tablas se crearon

Abre un nuevo query en la conexión **Mechin DB** y ejecuta:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Debes ver exactamente **23 tablas**:

```
calificaciones            mecanico_especialidades
cancelaciones_servicio    notificaciones
categorias_repuesto       pagos
comentarios               perfiles_mecanico
disponibilidad_mecanico   recuperacion_contrasena
especialidades            repuestos
estadisticas_sistema      reportes_incidencias
estados_servicio          roles
logs_acceso               servicios
                          tiendas
                          transacciones
                          usuarios
                          usuarios_roles
                          validaciones_solicitud
```

Para confirmar que los roles se insertaron, ejecuta:

```sql
SELECT * FROM roles;
```

Debes ver 4 filas: `cliente`, `mecanico`, `tienda`, `administrador`.

Si ves las 23 tablas y los 4 roles, **la base de datos está lista**. Continúa al siguiente paso.

---

## ⚙️ 4. Configurar el archivo .env

El archivo `.env` contiene las credenciales de tu entorno local. **Nunca se sube a Git** — cada integrante del equipo debe crear el suyo.

### Paso 4.1 — Crear el archivo

Dentro de la carpeta `Backend/`, crea un archivo nuevo llamado exactamente `.env` (con el punto al inicio, sin ninguna extensión adicional).

### Paso 4.2 — Pegar y ajustar el contenido

Copia el siguiente contenido y reemplaza los valores entre corchetes con tus datos reales:

```env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD="[tu contraseña de PostgreSQL]"
DB_NAME=mechin_db
DB_PORT=5432
JWT_SECRET=mechin_super_secret_jwt_key_2026
EMAIL_USER=[tu correo de Gmail]
EMAIL_PASS=[tu contraseña de aplicación de Gmail]
```

> ⚠️ **Sobre `DB_PASSWORD`:** Si tu contraseña contiene caracteres especiales como `#`, `@`, `!`, ponla **entre comillas dobles**. El símbolo `#` sin comillas se interpreta como inicio de comentario y la contraseña queda incompleta.
>
> ✅ Correcto: `DB_PASSWORD="mi#contraseña"`
> ❌ Incorrecto: `DB_PASSWORD=mi#contraseña`

### Paso 4.3 — Obtener la contraseña de aplicación de Gmail (EMAIL_PASS)

`EMAIL_PASS` **no es tu contraseña normal de Gmail**. Es una contraseña especial que genera Google para apps externas.

Para obtenerla:

1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Entra a **Seguridad**
3. Activa **Verificación en dos pasos** si no la tienes activa
4. Busca **Contraseñas de aplicaciones**
5. En el campo "Nombre de la app" escribe `MechinAPP`
6. Haz clic en **Crear**
7. Google te mostrará 16 caracteres — **cópialos inmediatamente**, no los vuelve a mostrar
8. Pega esos 16 caracteres como valor de `EMAIL_PASS` en tu `.env`

> 💡 Si no quieres configurar el correo ahora, puedes dejar `EMAIL_USER` y `EMAIL_PASS` vacíos. El servidor seguirá funcionando y mostrará el código de recuperación directamente en la consola.

---

## 🚀 5. Instalar dependencias y levantar el proyecto

Necesitas **dos terminales abiertas al mismo tiempo**.

### Terminal 1 — Backend

```bash
cd Backend
npm install
npm start
```

Si todo está bien, verás en la consola:

```
Server started on port 5000
Connected to PostgreSQL Database
✅ Servicio de correo listo
```

> Si ves `⚠️ Email no configurado` en lugar del último mensaje, el servidor igual funciona — solo el envío de correos estará desactivado.

### Terminal 2 — Frontend

Abre una segunda terminal (sin cerrar la primera) y ejecuta:

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
### Dependencias incluidas

Al ejecutar npm install se instalan automáticamente:

Backend: express, pg, bcryptjs, jsonwebtoken,
         express-validator, nodemailer, dotenv, cors

Frontend: react, react-router-dom, axios, lucide-react

Abre tu navegador y entra a **http://localhost:5173** — deberías ver la pantalla de bienvenida de Mechin.

---

## ✔️ 6. Verificar que todo funciona

Con ambas terminales corriendo, abre en el navegador:

```
http://localhost:5000/api/health
```

Debes ver una respuesta como esta:

```json
{
  "status": "✅ Conexión exitosa",
  "base_de_datos": "mechin_db",
  "hora_servidor": "2026-04-22T..."
}
```

Si ves esto, el backend está correctamente conectado a la base de datos y el proyecto está listo.

**Flujo completo para probar:**

1. Abre http://localhost:5173
2. Selecciona un tipo de cuenta y regístrate
3. Inicia sesión con las credenciales recién creadas
4. Verifica que te redirige al dashboard correspondiente a tu rol
5. Prueba el flujo de recuperación de contraseña con un correo registrado

---

## 🛠️ 7. Solución de problemas comunes

### ❌ La página en http://localhost:5173 aparece en blanco
Abre la consola del navegador con `F12` → pestaña **Console** y busca el error en rojo. Lo más común es que un archivo de página esté vacío y no tenga un `export default`. Revisa los archivos dentro de `Frontend/src/pages/`.

### ❌ `password authentication failed for user "postgres"`
La contraseña en tu `.env` es incorrecta o tiene caracteres especiales sin comillas dobles.
→ Revisa que `DB_PASSWORD` esté entre comillas dobles si contiene `#`, `@`, `!` u otros caracteres especiales.

### ❌ `database "mechin_db" does not exist`
La base de datos no fue creada todavía.
→ Regresa al **Paso 3.3** y crea la base de datos.

### ❌ `no existe la relación «usuarios»`
El script `init.sql` no se ejecutó o se ejecutó en la base de datos equivocada (`postgres` en vez de `mechin_db`).
→ Asegúrate de estar conectado a **Mechin DB** y vuelve a ejecutar el `init.sql` desde el **Paso 3.5**.

### ❌ `connect ECONNREFUSED 127.0.0.1:5432`
PostgreSQL no está corriendo en tu máquina.
→ En Windows: abre `services.msc`, busca **postgresql** y verifica que esté en estado **"En ejecución"**. Si no, haz clic derecho → **Iniciar**.

### ❌ `Cannot GET /api/health`
El backend no está corriendo o se detuvo por un error.
→ Revisa la Terminal 1. Si hay un error, léelo con atención — generalmente indica exactamente qué archivo o variable está mal configurada.

### ❌ `⚠️ Email no configurado: Missing credentials for "PLAIN"`
Las variables `EMAIL_USER` y `EMAIL_PASS` no están en el `.env` o están vacías.
→ El servidor funciona normalmente. El código de recuperación aparecerá en la consola del backend en vez de llegar al correo. Para configurarlo, sigue el **Paso 4.3**.

---

## 👥 Equipo de desarrollo

Proyecto desarrollado como parte del curso de Ingeniería de Software — Universidad de Manizales.
Stack: **React + Node.js + PostgreSQL**
