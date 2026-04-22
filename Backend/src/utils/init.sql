-- ============================================================
-- MECHIN — Script de creación de base de datos
-- Motor: PostgreSQL
-- Descripción: Marketplace de servicios automotrices — Manizales
-- Stack: React + Node.js + PostgreSQL
-- ============================================================

-- Eliminar base de datos si existe y crearla limpia
-- DROP DATABASE IF EXISTS mechin_db;
-- CREATE DATABASE mechin_db;
-- \c mechin_db;

-- Extensión para UUIDs si se requiere en el futuro
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MÓDULO 1 — GESTIÓN DE USUARIOS
-- ============================================================

CREATE TABLE roles (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(50)  NOT NULL UNIQUE,
    descripcion      VARCHAR(255),
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id               SERIAL PRIMARY KEY,
    nombre_completo  VARCHAR(150) NOT NULL,
    correo           VARCHAR(150) NOT NULL UNIQUE,
    telefono         VARCHAR(20),
    contrasena_hash  VARCHAR(255) NOT NULL,
    foto_perfil      VARCHAR(500),
    direccion        VARCHAR(300),
    latitud          DECIMAL(10, 7),
    longitud         DECIMAL(10, 7),
    esta_activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    esta_verificado  BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios_roles (
    id               SERIAL PRIMARY KEY,
    usuario_id       INT          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id           INT          NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    asignado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, rol_id)
);

CREATE TABLE recuperacion_contrasena (
    id               SERIAL PRIMARY KEY,
    usuario_id       INT          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token            VARCHAR(255) NOT NULL UNIQUE,
    expira_en        TIMESTAMP    NOT NULL,
    usado            BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE logs_acceso (
    id               SERIAL PRIMARY KEY,
    usuario_id       INT          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    accion           VARCHAR(100) NOT NULL,
    ip_address       VARCHAR(50),
    dispositivo      VARCHAR(200),
    exitoso          BOOLEAN      NOT NULL DEFAULT TRUE,
    registrado_en    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 2 — PERFILES DE MECÁNICOS
-- ============================================================

CREATE TABLE perfiles_mecanico (
    id                SERIAL PRIMARY KEY,
    usuario_id        INT           NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    biografia         TEXT,
    esta_validado     BOOLEAN       NOT NULL DEFAULT FALSE,
    disponible        BOOLEAN       NOT NULL DEFAULT FALSE,
    ciudad            VARCHAR(100),
    estado_validacion VARCHAR(50)   NOT NULL DEFAULT 'pendiente'
                      CHECK (estado_validacion IN ('pendiente', 'aprobado', 'rechazado')),
    fecha_validacion  TIMESTAMP,
    promedio_rating   DECIMAL(3, 2) NOT NULL DEFAULT 0.00
                      CHECK (promedio_rating >= 0 AND promedio_rating <= 5),
    total_servicios   INT           NOT NULL DEFAULT 0
                      CHECK (total_servicios >= 0),
    creado_en         TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE especialidades (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(300)
);

CREATE TABLE mecanico_especialidades (
    id                  SERIAL PRIMARY KEY,
    perfil_mecanico_id  INT       NOT NULL REFERENCES perfiles_mecanico(id) ON DELETE CASCADE,
    especialidad_id     INT       NOT NULL REFERENCES especialidades(id) ON DELETE RESTRICT,
    asignado_en         TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (perfil_mecanico_id, especialidad_id)
);

CREATE TABLE disponibilidad_mecanico (
    id                  SERIAL PRIMARY KEY,
    perfil_mecanico_id  INT          NOT NULL REFERENCES perfiles_mecanico(id) ON DELETE CASCADE,
    dia_semana          VARCHAR(15)  NOT NULL
                        CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
    hora_inicio         TIME         NOT NULL,
    hora_fin            TIME         NOT NULL,
    esta_activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CHECK (hora_fin > hora_inicio)
);

-- ============================================================
-- MÓDULO 3 — SERVICIOS MECÁNICOS
-- ============================================================

CREATE TABLE servicios (
    id                   SERIAL PRIMARY KEY,
    cliente_id           INT           NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    mecanico_id          INT           REFERENCES perfiles_mecanico(id) ON DELETE SET NULL,
    tipo_servicio        VARCHAR(100)  NOT NULL,
    descripcion          TEXT          NOT NULL,
    direccion_servicio   VARCHAR(300)  NOT NULL,
    latitud_servicio     DECIMAL(10, 7),
    longitud_servicio    DECIMAL(10, 7),
    estado               VARCHAR(50)   NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente', 'asignado', 'en_camino', 'en_progreso', 'finalizado', 'cancelado')),
    precio_estimado      DECIMAL(12, 2),
    precio_final         DECIMAL(12, 2),
    fecha_solicitud      TIMESTAMP     NOT NULL DEFAULT NOW(),
    fecha_asignacion     TIMESTAMP,
    fecha_inicio         TIMESTAMP,
    fecha_finalizacion   TIMESTAMP,
    creado_en            TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE estados_servicio (
    id               SERIAL PRIMARY KEY,
    servicio_id      INT          NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    usuario_id       INT          NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    estado_anterior  VARCHAR(50)  NOT NULL,
    estado_nuevo     VARCHAR(50)  NOT NULL,
    observacion      TEXT,
    registrado_en    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE cancelaciones_servicio (
    id               SERIAL PRIMARY KEY,
    servicio_id      INT          NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    cancelado_por    INT          NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo           VARCHAR(150) NOT NULL,
    descripcion      TEXT,
    cancelado_en     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE validaciones_solicitud (
    id               SERIAL PRIMARY KEY,
    servicio_id      INT       NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    validado_por     INT       NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    aprobado         BOOLEAN   NOT NULL,
    observacion      TEXT,
    validado_en      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notificaciones (
    id               SERIAL PRIMARY KEY,
    usuario_id       INT          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    servicio_id      INT          REFERENCES servicios(id) ON DELETE SET NULL,
    tipo             VARCHAR(100) NOT NULL,
    mensaje          TEXT         NOT NULL,
    leida            BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 4 — SISTEMA DE REPUTACIÓN
-- ============================================================

CREATE TABLE calificaciones (
    id                SERIAL PRIMARY KEY,
    servicio_id       INT       NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    cliente_id        INT       NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    mecanico_id       INT       NOT NULL REFERENCES perfiles_mecanico(id) ON DELETE CASCADE,
    puntaje           INT       NOT NULL CHECK (puntaje >= 1 AND puntaje <= 5),
    esta_eliminado    BOOLEAN   NOT NULL DEFAULT FALSE,
    creado_en         TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (servicio_id, cliente_id)
);

CREATE TABLE comentarios (
    id               SERIAL PRIMARY KEY,
    calificacion_id  INT       NOT NULL REFERENCES calificaciones(id) ON DELETE CASCADE,
    cliente_id       INT       NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    contenido        TEXT      NOT NULL,
    esta_editado     BOOLEAN   NOT NULL DEFAULT FALSE,
    esta_eliminado   BOOLEAN   NOT NULL DEFAULT FALSE,
    esta_validado    BOOLEAN   NOT NULL DEFAULT FALSE,
    creado_en        TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 5 — CATÁLOGO DE REPUESTOS
-- ============================================================

CREATE TABLE tiendas (
    id               SERIAL PRIMARY KEY,
    usuario_id       INT          NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre           VARCHAR(200) NOT NULL,
    direccion        VARCHAR(300),
    latitud          DECIMAL(10, 7),
    longitud         DECIMAL(10, 7),
    telefono         VARCHAR(20),
    esta_activa      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias_repuesto (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(300),
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE repuestos (
    id               SERIAL PRIMARY KEY,
    tienda_id        INT           NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    categoria_id     INT           NOT NULL REFERENCES categorias_repuesto(id) ON DELETE RESTRICT,
    nombre           VARCHAR(200)  NOT NULL,
    descripcion      TEXT,
    marca            VARCHAR(100),
    referencia       VARCHAR(100),
    precio           DECIMAL(12,2) NOT NULL CHECK (precio >= 0),
    stock            INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url       VARCHAR(500),
    estado           VARCHAR(50)   NOT NULL DEFAULT 'disponible'
                     CHECK (estado IN ('disponible', 'agotado', 'descontinuado')),
    esta_activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en        TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (tienda_id, referencia)
);

-- ============================================================
-- MÓDULO 6 — PAGOS Y TRANSACCIONES
-- ============================================================

CREATE TABLE pagos (
    id                    SERIAL PRIMARY KEY,
    servicio_id           INT           NOT NULL UNIQUE REFERENCES servicios(id) ON DELETE RESTRICT,
    cliente_id            INT           NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    mecanico_id           INT           NOT NULL REFERENCES perfiles_mecanico(id) ON DELETE RESTRICT,
    monto_total           DECIMAL(12,2) NOT NULL CHECK (monto_total > 0),
    comision_plataforma   DECIMAL(12,2) NOT NULL CHECK (comision_plataforma >= 0),
    monto_mecanico        DECIMAL(12,2) NOT NULL CHECK (monto_mecanico >= 0),
    metodo_pago           VARCHAR(50)   NOT NULL,
    estado                VARCHAR(50)   NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'validado', 'confirmado', 'fallido', 'reembolsado')),
    referencia_simulada   VARCHAR(200),
    fecha_pago            TIMESTAMP,
    creado_en             TIMESTAMP     NOT NULL DEFAULT NOW(),
    actualizado_en        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE desglose_pago (
    id               SERIAL PRIMARY KEY,
    pago_id          INT           NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
    concepto         VARCHAR(150)  NOT NULL,
    descripcion      TEXT,
    monto            DECIMAL(12,2) NOT NULL,
    creado_en        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE transacciones (
    id               SERIAL PRIMARY KEY,
    pago_id          INT           NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
    tipo             VARCHAR(50)   NOT NULL,
    monto            DECIMAL(12,2) NOT NULL,
    descripcion      VARCHAR(300),
    registrado_en    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 7 — PANEL ADMINISTRATIVO
-- ============================================================

CREATE TABLE reportes_incidencias (
    id               SERIAL PRIMARY KEY,
    usuario_id       INT          NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    servicio_id      INT          REFERENCES servicios(id) ON DELETE SET NULL,
    tipo             VARCHAR(100) NOT NULL,
    descripcion      TEXT         NOT NULL,
    estado           VARCHAR(50)  NOT NULL DEFAULT 'abierto'
                     CHECK (estado IN ('abierto', 'en_revision', 'resuelto', 'cerrado')),
    resolucion       TEXT,
    resuelto_por     INT          REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE estadisticas_sistema (
    id               SERIAL PRIMARY KEY,
    metrica          VARCHAR(150) NOT NULL,
    modulo           VARCHAR(100) NOT NULL,
    valor            DECIMAL(15,2) NOT NULL,
    descripcion      TEXT,
    fecha_registro   DATE         NOT NULL DEFAULT CURRENT_DATE,
    creado_en        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES — Para optimizar consultas frecuentes
-- ============================================================

-- Usuarios
CREATE INDEX idx_usuarios_correo          ON usuarios(correo);
CREATE INDEX idx_usuarios_esta_activo     ON usuarios(esta_activo);

-- Usuarios roles
CREATE INDEX idx_usuarios_roles_usuario   ON usuarios_roles(usuario_id);
CREATE INDEX idx_usuarios_roles_rol       ON usuarios_roles(rol_id);

-- Recuperación contraseña
CREATE INDEX idx_recuperacion_token       ON recuperacion_contrasena(token);
CREATE INDEX idx_recuperacion_usuario     ON recuperacion_contrasena(usuario_id);

-- Perfiles mecánico
CREATE INDEX idx_perfil_usuario           ON perfiles_mecanico(usuario_id);
CREATE INDEX idx_perfil_disponible        ON perfiles_mecanico(disponible);
CREATE INDEX idx_perfil_validado          ON perfiles_mecanico(esta_validado);

-- Disponibilidad mecánico
CREATE INDEX idx_disponibilidad_perfil    ON disponibilidad_mecanico(perfil_mecanico_id);

-- Servicios
CREATE INDEX idx_servicios_cliente        ON servicios(cliente_id);
CREATE INDEX idx_servicios_mecanico       ON servicios(mecanico_id);
CREATE INDEX idx_servicios_estado         ON servicios(estado);
CREATE INDEX idx_servicios_fecha          ON servicios(fecha_solicitud);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario   ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida     ON notificaciones(leida);

-- Calificaciones
CREATE INDEX idx_calificaciones_mecanico  ON calificaciones(mecanico_id);
CREATE INDEX idx_calificaciones_cliente   ON calificaciones(cliente_id);
CREATE INDEX idx_calificaciones_servicio  ON calificaciones(servicio_id);

-- Repuestos
CREATE INDEX idx_repuestos_tienda         ON repuestos(tienda_id);
CREATE INDEX idx_repuestos_categoria      ON repuestos(categoria_id);
CREATE INDEX idx_repuestos_estado         ON repuestos(estado);
CREATE INDEX idx_repuestos_nombre         ON repuestos(nombre);

-- Pagos
CREATE INDEX idx_pagos_cliente            ON pagos(cliente_id);
CREATE INDEX idx_pagos_mecanico           ON pagos(mecanico_id);
CREATE INDEX idx_pagos_servicio           ON pagos(servicio_id);
CREATE INDEX idx_pagos_estado             ON pagos(estado);

-- Reportes
CREATE INDEX idx_reportes_usuario         ON reportes_incidencias(usuario_id);
CREATE INDEX idx_reportes_estado          ON reportes_incidencias(estado);

-- ============================================================
-- DATOS SEMILLA — Datos iniciales del sistema
-- ============================================================

-- Roles del sistema
INSERT INTO roles (nombre, descripcion) VALUES
    ('cliente',        'Usuario que solicita servicios mecánicos'),
    ('mecanico',       'Profesional certificado que presta servicios'),
    ('tienda',         'Tienda de repuestos automotrices'),
    ('administrador',  'Operador con acceso total al sistema');

-- Especialidades disponibles para mecánicos
INSERT INTO especialidades (nombre, descripcion) VALUES
    ('Mecánica general',        'Reparación y mantenimiento general de vehículos'),
    ('Mecánica eléctrica',      'Diagnóstico y reparación de sistemas eléctricos'),
    ('Diagnóstico computarizado','Uso de escáner OBD para diagnóstico electrónico'),
    ('Frenos y suspensión',     'Reparación de sistemas de frenos y suspensión'),
    ('Aire acondicionado',      'Mantenimiento y recarga de sistemas de climatización'),
    ('Transmisión',             'Reparación de cajas de cambio manuales y automáticas'),
    ('Motor',                   'Reparación mayor y menor de motores'),
    ('Carrocería',              'Reparación de golpes y pintura automotriz');

-- Categorías de repuestos
INSERT INTO categorias_repuesto (nombre, descripcion) VALUES
    ('Filtros',             'Filtros de aire, aceite, combustible y habitáculo'),
    ('Frenos',              'Pastillas, discos, tambores y líquido de frenos'),
    ('Suspensión',          'Amortiguadores, resortes, bujes y rotulas'),
    ('Eléctrico',           'Baterías, alternadores, cables y sensores'),
    ('Motor',               'Correas, juntas, bujías y repuestos de motor'),
    ('Transmisión',         'Clutch, embragues y partes de caja de cambios'),
    ('Lubricantes',         'Aceites de motor, transmisión y refrigerantes'),
    ('Carrocería',          'Espejos, luces, parachoques y accesorios externos');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================