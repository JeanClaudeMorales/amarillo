import mysql from 'mysql2/promise';
import 'dotenv/config';

// Connection pool — shared across all requests
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'mysql',
      password: process.env.DB_PASS || '12345678',
      database: process.env.DB_NAME || 'emily',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
    });
  }
  return pool;
}

// Helper: run a query and return all rows
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

// Helper: run a query and return a single row (or null)
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

// Helper: run INSERT / UPDATE / DELETE and return result info
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// Initialize schema (CREATE TABLE IF NOT EXISTS …)
export async function initializeSchema(): Promise<void> {
  const db = getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS estados (
      id     INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(128) NOT NULL,
      iso    VARCHAR(10)  NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS municipios (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      estado_id INT NOT NULL,
      nombre    VARCHAR(128) NOT NULL,
      FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE CASCADE,
      INDEX idx_municipios_estado (estado_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS parroquias (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      municipio_id INT NOT NULL,
      nombre       VARCHAR(128) NOT NULL,
      FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE CASCADE,
      INDEX idx_parroquias_municipio (municipio_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      username        VARCHAR(64) UNIQUE NOT NULL,
      password_hash   VARCHAR(128) NOT NULL,
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
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      admin_id   INT NOT NULL,
      token      VARCHAR(128) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
      INDEX idx_sessions_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
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
  `);

  await db.execute(`
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
  `);

  await db.execute(`
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
      FOREIGN KEY (parroquia_id)    REFERENCES parroquias(id),
      FOREIGN KEY (access_point_id) REFERENCES access_points(id),
      FOREIGN KEY (security_question_id) REFERENCES questions(id),
      INDEX idx_users_cedula    (cedula),
      INDEX idx_users_parroquia (parroquia_id),
      INDEX idx_users_ap        (access_point_id),
      INDEX idx_users_connected (connected_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS portal_config (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      \`key\`    VARCHAR(64) UNIQUE NOT NULL,
      value      TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('✅ MySQL schema initialized');
}
