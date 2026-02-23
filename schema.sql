-- =============================================================
-- Amarillo WiFi CRM — Schema MySQL
-- Version: 3.0.0
-- Compatible con: MySQL 8.x / 9.x (imagen mysql:9)
--
-- Uso:
--   mysql -h localhost -u mysql -p emily < schema.sql
--
-- O bien, el servidor lo crea automáticamente al arrancar.
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
-- 1. GEOGRAFÍA
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS estados (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(128) NOT NULL,
  iso    VARCHAR(10)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS municipios (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  estado_id INT NOT NULL,
  nombre    VARCHAR(128) NOT NULL,
  FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE CASCADE,
  INDEX idx_municipios_estado (estado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parroquias (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  municipio_id INT NOT NULL,
  nombre       VARCHAR(128) NOT NULL,
  FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE CASCADE,
  INDEX idx_parroquias_municipio (municipio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 2. ADMINISTRADORES CRM
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(64) UNIQUE NOT NULL,
  password_hash   VARCHAR(128) NOT NULL,
  -- superadmin = todo Venezuela + gestión de admins
  -- nacional   = todo Venezuela (sin gestión de admins)
  -- estadal    = solo estado_id asignado
  -- municipal  = solo municipio_id asignado
  role            ENUM('superadmin','nacional','estadal','municipal') NOT NULL,
  estado_id       INT DEFAULT NULL,
  municipio_id    INT DEFAULT NULL,
  nombre_completo VARCHAR(128) NOT NULL,
  email           VARCHAR(128) DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active       TINYINT(1) DEFAULT 1,
  FOREIGN KEY (estado_id)    REFERENCES estados(id),
  FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  INDEX idx_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT NOT NULL,
  token      VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  INDEX idx_sessions_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 3. PUNTOS DE ACCESO (ANTENAS MIKROTIK)
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS access_points (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(128) NOT NULL,
  codigo          VARCHAR(64) UNIQUE NOT NULL,
  parroquia_id    INT DEFAULT NULL,
  ip_address      VARCHAR(45)  DEFAULT NULL,
  mac_address     VARCHAR(17)  DEFAULT NULL,
  status          ENUM('activo','inactivo','mantenimiento') DEFAULT 'activo',
  signal_dbm      INT DEFAULT -65,
  connected_users INT DEFAULT 0,
  bandwidth_mbps  FLOAT DEFAULT 100,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parroquia_id) REFERENCES parroquias(id),
  INDEX idx_ap_parroquia (parroquia_id),
  INDEX idx_ap_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 4. PREGUNTAS DE SEGURIDAD
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS questions (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  texto              TEXT NOT NULL,
  tipo               ENUM('abierta','matematica','opcion_multiple') DEFAULT 'abierta',
  opciones           TEXT DEFAULT NULL,
  respuesta_correcta VARCHAR(255) DEFAULT NULL,
  estado_id          INT DEFAULT NULL,
  is_active          TINYINT(1) DEFAULT 1,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estado_id) REFERENCES estados(id),
  INDEX idx_questions_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 5. USUARIOS DEL PORTAL CAUTIVO
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS captive_users (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo      VARCHAR(128) NOT NULL,
  cedula               VARCHAR(32) UNIQUE NOT NULL,
  whatsapp             VARCHAR(32)  DEFAULT NULL,
  fecha_nacimiento     DATE         DEFAULT NULL,
  direccion            TEXT         DEFAULT NULL,
  parroquia_id         INT DEFAULT NULL,
  access_point_id      INT DEFAULT NULL,
  security_question_id INT DEFAULT NULL,
  security_answer      VARCHAR(255) DEFAULT NULL,
  connected_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active            TINYINT(1) DEFAULT 1,
  FOREIGN KEY (parroquia_id)         REFERENCES parroquias(id),
  FOREIGN KEY (access_point_id)      REFERENCES access_points(id),
  FOREIGN KEY (security_question_id) REFERENCES questions(id),
  INDEX idx_users_cedula    (cedula),
  INDEX idx_users_parroquia (parroquia_id),
  INDEX idx_users_ap        (access_point_id),
  INDEX idx_users_connected (connected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 6. CONFIGURACIÓN DEL PORTAL
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS portal_config (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  `key`      VARCHAR(64) UNIQUE NOT NULL,
  value      TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------
-- DATOS INICIALES (el servidor los inserta automáticamente)
-- -----------------------------------------------------------

-- Portal config por defecto
INSERT IGNORE INTO portal_config (`key`, value) VALUES
  ('consent_title',            'Tratamiento de Datos'),
  ('consent_body',             'Al conectarse a esta red WiFi pública, usted acepta nuestros términos de privacidad y el uso de sus datos para fines estadísticos de conectividad pública, conforme a la legislación venezolana vigente.'),
  ('welcome_message',          'Ingresa tus datos para navegar gratis en la red pública.'),
  ('session_duration_minutes', '120'),
  ('network_name',             'Mérida te conecta');

-- Preguntas predeterminadas
INSERT IGNORE INTO questions (texto, tipo, respuesta_correcta) VALUES
  ('¿Cuánto es 5 + 3?',  'matematica', '8'),
  ('¿Cuánto es 12 - 4?', 'matematica', '8'),
  ('¿Cuánto es 7 + 6?',  'matematica', '13'),
  ('¿Cuánto es 20 ÷ 4?', 'matematica', '5'),
  ('¿Cuánto es 3 × 3?',  'matematica', '9'),
  ('¿Cuánto es 15 - 7?', 'matematica', '8'),
  ('¿Cómo calificarías la calidad del WiFi público?', 'abierta', NULL),
  ('¿Es esta su primera vez usando esta red?',         'abierta', NULL);

-- Superadmin inicial
-- IMPORTANTE: Cambia PASSWORD_SALT en .env antes de usar.
-- El hash correcto se genera con el servidor al arrancar.
-- Si necesitas insertarlo manualmente, genera el hash con:
--   node -e "const c=require('crypto'); const s=process.env.PASSWORD_SALT||'cambia_este_valor'; console.log(c.createHash('sha256').update('admin123'+s).digest('hex'))"
--
-- INSERT IGNORE INTO admin_users (username, password_hash, role, nombre_completo)
-- VALUES ('admin', '<HASH_CALCULADO>', 'superadmin', 'Super Administrador');
