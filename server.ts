import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { initializeSchema, query, queryOne, execute, waitForDB } from './db/database.js';
import { seedDatabase } from './db/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || process.env.API_PORT || '3000', 10);
export const PASSWORD_SALT = process.env.PASSWORD_SALT || 'amarillo_salt_2024';

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// --- HELPERS ---
export function hashPassword(password: string) {
    return crypto.createHash('sha256').update(password + PASSWORD_SALT).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function getAdminByToken(token: string): Promise<any | null> {
    return queryOne(`
    SELECT s.admin_id, a.username, a.role, a.nombre_completo, a.estado_id, a.municipio_id, a.email
    FROM admin_sessions s JOIN admin_users a ON s.admin_id = a.id
    WHERE s.token = ? AND s.expires_at > NOW() AND a.is_active = 1
  `, [token]);
}

function authMiddleware(req: any, res: any, next: any) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
    const token = auth.slice(7);
    getAdminByToken(token).then(admin => {
        if (!admin) return res.status(401).json({ error: 'Sesión inválida o expirada' });
        req.admin = admin;
        req.token = token;
        next();
    }).catch(() => res.status(500).json({ error: 'Error de autenticación' }));
}

function superadminOnly(req: any, res: any, next: any) {
    if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Solo superadmin' });
    next();
}

function buildScopeFilter(admin: any, alias = '') {
    const t = alias ? `${alias}.` : '';
    if (admin.role === 'superadmin' || admin.role === 'nacional') {
        return { where: '1=1', params: [] as any[] };
    }
    if (admin.role === 'estadal') {
        return {
            where: `${t}parroquia_id IN (
        SELECT p.id FROM parroquias p
        JOIN municipios m ON p.municipio_id = m.id
        WHERE m.estado_id = ?
      )`,
            params: [admin.estado_id]
        };
    }
    if (admin.role === 'municipal') {
        return {
            where: `${t}parroquia_id IN (SELECT id FROM parroquias WHERE municipio_id = ?)`,
            params: [admin.municipio_id]
        };
    }
    return { where: '1=1', params: [] as any[] };
}

// ======================
// AUTH
// ======================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' });
        const admin = await queryOne<any>('SELECT * FROM admin_users WHERE username = ? AND is_active = 1', [username]);
        if (!admin || admin.password_hash !== hashPassword(password)) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        const token = generateToken();
        await execute(`INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))`, [admin.id, token]);
        res.json({ token, admin: { id: admin.id, username: admin.username, role: admin.role, nombre_completo: admin.nombre_completo, email: admin.email, estado_id: admin.estado_id, municipio_id: admin.municipio_id } });
    } catch (e) { res.status(500).json({ error: 'Error de servidor' }); }
});

app.post('/api/auth/logout', authMiddleware, async (req: any, res) => {
    try { await execute('DELETE FROM admin_sessions WHERE token = ?', [req.token]); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => res.json({ admin: req.admin }));

// ======================
// GEOGRAPHY
// ======================
app.get('/api/geography/estados', authMiddleware, async (req: any, res) => {
    try {
        const { role, estado_id, municipio_id } = req.admin;
        if (role === 'estadal') {
            const r = await query('SELECT * FROM estados WHERE id = ?', [estado_id]);
            return res.json(r);
        }
        if (role === 'municipal') {
            const m = await queryOne<any>('SELECT estado_id FROM municipios WHERE id = ?', [municipio_id]);
            const r = await query('SELECT * FROM estados WHERE id = ?', [m?.estado_id]);
            return res.json(r);
        }
        res.json(await query('SELECT * FROM estados ORDER BY nombre'));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/geography/municipios', authMiddleware, async (req: any, res) => {
    try {
        const { estado_id: q_estado } = req.query;
        const { role, municipio_id } = req.admin;
        if (role === 'municipal') {
            return res.json(await query('SELECT * FROM municipios WHERE id = ?', [municipio_id]));
        }
        if (!q_estado) return res.status(400).json({ error: 'estado_id requerido' });
        res.json(await query('SELECT * FROM municipios WHERE estado_id = ? ORDER BY nombre', [q_estado]));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/geography/parroquias', authMiddleware, async (req: any, res) => {
    try {
        const { municipio_id } = req.query;
        if (!municipio_id) return res.status(400).json({ error: 'municipio_id requerido' });
        res.json(await query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM access_points ap WHERE ap.parroquia_id = p.id) as total_aps,
        (SELECT COUNT(*) FROM access_points ap WHERE ap.parroquia_id = p.id AND ap.status = 'activo') as active_aps,
        (SELECT COALESCE(SUM(connected_users),0) FROM access_points ap WHERE ap.parroquia_id = p.id) as total_users
      FROM parroquias p WHERE p.municipio_id = ? ORDER BY p.nombre
    `, [municipio_id]));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/geography/stats', authMiddleware, async (req: any, res) => {
    try {
        const { estado_id } = req.query;
        const sql = `SELECT e.id, e.nombre, e.iso,
      COUNT(DISTINCT ap.id) as total_aps,
      COUNT(DISTINCT CASE WHEN ap.status='activo' THEN ap.id END) as active_aps,
      COALESCE(SUM(ap.connected_users),0) as total_users
      FROM estados e
      LEFT JOIN municipios m ON m.estado_id = e.id
      LEFT JOIN parroquias p ON p.municipio_id = m.id
      LEFT JOIN access_points ap ON ap.parroquia_id = p.id
      ${estado_id ? 'WHERE e.id = ?' : ''}
      GROUP BY e.id ORDER BY e.nombre`;
        res.json(await query(sql, estado_id ? [estado_id] : []));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// CAPTIVE USERS
// ======================
app.post('/api/users', async (req, res) => {
    try {
        const { nombre_completo, cedula, whatsapp, fecha_nacimiento, direccion, parroquia_id, access_point_id, security_question_id, security_answer } = req.body;
        if (!nombre_completo || !cedula) return res.status(400).json({ error: 'Nombre y cédula requeridos' });

        try {
            const result = await execute(
                `INSERT INTO captive_users (nombre_completo, cedula, whatsapp, fecha_nacimiento, direccion, parroquia_id, access_point_id, security_question_id, security_answer) VALUES (?,?,?,?,?,?,?,?,?)`,
                [nombre_completo, cedula, whatsapp || null, fecha_nacimiento || null, direccion || null, parroquia_id || null, access_point_id || null, security_question_id || null, security_answer || null]
            );

            if (access_point_id) {
                await execute('UPDATE access_points SET connected_users = connected_users + 1 WHERE id = ?', [access_point_id]);
            }
            res.json({ ok: true, id: result.insertId });
        } catch (dbErr: any) {
            // Handle duplicate cedula
            if (dbErr.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Esta cédula ya está registrada' });
            }
            throw dbErr;
        }
    } catch (e: any) {
        console.error('L', e);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

app.get('/api/users', authMiddleware, async (req: any, res) => {
    try {
        const { search, parroquia_id, page = 1, limit = 50 } = req.query;
        const { where: scopeWhere, params: scopeParams } = buildScopeFilter(req.admin, 'u');
        const offset = (Number(page) - 1) * Number(limit);
        const conditions: string[] = [scopeWhere];
        const params: any[] = [...scopeParams];
        if (search) { conditions.push('(u.nombre_completo LIKE ? OR u.cedula LIKE ? OR u.whatsapp LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
        if (parroquia_id) { conditions.push('u.parroquia_id = ?'); params.push(parroquia_id); }
        const where = conditions.join(' AND ');
        const users = await query(`
      SELECT u.*, p.nombre as parroquia_nombre, ap.nombre as ap_nombre, ap.codigo as ap_codigo
      FROM captive_users u
      LEFT JOIN parroquias p ON u.parroquia_id = p.id
      LEFT JOIN access_points ap ON u.access_point_id = ap.id
      WHERE ${where} ORDER BY u.connected_at DESC LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset]);
        const totalRow = await queryOne<any>(`SELECT COUNT(*) as c FROM captive_users u WHERE ${where}`, params);
        res.json({ users, total: totalRow?.c || 0, page: Number(page), limit: Number(limit) });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/users/:id', authMiddleware, async (req: any, res) => {
    try {
        const user = await queryOne(`
      SELECT u.*, p.nombre as parroquia_nombre, ap.nombre as ap_nombre, q.texto as question_texto
      FROM captive_users u
      LEFT JOIN parroquias p ON u.parroquia_id = p.id
      LEFT JOIN access_points ap ON u.access_point_id = ap.id
      LEFT JOIN questions q ON u.security_question_id = q.id
      WHERE u.id = ?
    `, [req.params.id]);
        if (!user) return res.status(404).json({ error: 'No encontrado' });
        res.json(user);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// QUESTIONS
// ======================
app.get('/api/questions/random', async (req, res) => {
    try {
        const q = await queryOne('SELECT * FROM questions WHERE is_active = 1 ORDER BY RAND() LIMIT 1');
        res.json(q || { id: null, texto: '¿Cuánto es 2 + 2?', tipo: 'matematica', respuesta_correcta: '4' });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/questions', authMiddleware, async (req: any, res) => {
    try {
        const { role, estado_id } = req.admin;
        const rows = role === 'estadal'
            ? await query('SELECT * FROM questions WHERE (estado_id = ? OR estado_id IS NULL) ORDER BY created_at DESC', [estado_id])
            : await query('SELECT * FROM questions ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/questions', authMiddleware, async (req: any, res) => {
    try {
        const { texto, tipo = 'abierta', opciones, respuesta_correcta } = req.body;
        if (!texto) return res.status(400).json({ error: 'Texto requerido' });
        const estado_id = req.admin.role === 'estadal' ? req.admin.estado_id : null;
        const result = await execute('INSERT INTO questions (texto, tipo, opciones, respuesta_correcta, estado_id) VALUES (?,?,?,?,?)',
            [texto, tipo, opciones ? JSON.stringify(opciones) : null, respuesta_correcta || null, estado_id]);
        res.json({ ok: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/questions/:id', authMiddleware, async (req: any, res) => {
    try {
        const { texto, tipo, is_active } = req.body;
        await execute('UPDATE questions SET texto = COALESCE(?, texto), tipo = COALESCE(?, tipo), is_active = COALESCE(?, is_active) WHERE id = ?',
            [texto || null, tipo || null, is_active !== undefined ? is_active : null, req.params.id]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/questions/:id', authMiddleware, async (req: any, res) => {
    try { await execute('DELETE FROM questions WHERE id = ?', [req.params.id]); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// PORTAL CONFIG
// ======================
app.get('/api/portal-config', async (req, res) => {
    try {
        const rows = await query<{ key: string; value: string }>('SELECT `key`, value FROM portal_config');
        const config: Record<string, string> = {};
        rows.forEach(r => config[r.key] = r.value);
        res.json(config);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/portal-config', authMiddleware, async (req: any, res) => {
    try {
        const updates = req.body as Record<string, string>;
        for (const [k, v] of Object.entries(updates)) {
            await execute('INSERT INTO portal_config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()', [k, v]);
        }
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// ACCESS POINTS
// ======================
app.get('/api/access-points', authMiddleware, async (req: any, res) => {
    try {
        const { parroquia_id } = req.query;
        const { where: scopeWhere, params: scopeParams } = buildScopeFilter(req.admin, 'ap');
        const conditions = [scopeWhere];
        const params: any[] = [...scopeParams];
        if (parroquia_id) { conditions.push('ap.parroquia_id = ?'); params.push(parroquia_id); }
        res.json(await query(`
      SELECT ap.*, p.nombre as parroquia_nombre,
        m.nombre as municipio_nombre, m.id as municipio_id,
        e.nombre as estado_nombre
      FROM access_points ap
      LEFT JOIN parroquias p ON ap.parroquia_id = p.id
      LEFT JOIN municipios m ON p.municipio_id = m.id
      LEFT JOIN estados e ON m.estado_id = e.id
      WHERE ${conditions.join(' AND ')} ORDER BY ap.status DESC, ap.nombre
    `, params));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/access-points', authMiddleware, async (req: any, res) => {
    try {
        const { nombre, codigo, parroquia_id, ip_address, mac_address, bandwidth_mbps = 100 } = req.body;
        if (!nombre || !codigo) return res.status(400).json({ error: 'Nombre y código requeridos' });
        const result = await execute(
            'INSERT INTO access_points (nombre, codigo, parroquia_id, ip_address, mac_address, bandwidth_mbps) VALUES (?,?,?,?,?,?)',
            [nombre, codigo, parroquia_id || null, ip_address || null, mac_address || null, bandwidth_mbps]
        );
        res.json({ ok: true, id: result.insertId });
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Código de AP ya existe' });
        res.status(500).json({ error: 'Error al crear AP' });
    }
});

app.put('/api/access-points/:id', authMiddleware, async (req: any, res) => {
    try {
        const { nombre, codigo, parroquia_id, ip_address, mac_address, status, bandwidth_mbps } = req.body;
        await execute(`
      UPDATE access_points SET
        nombre = COALESCE(?, nombre), codigo = COALESCE(?, codigo),
        parroquia_id = COALESCE(?, parroquia_id), ip_address = COALESCE(?, ip_address),
        mac_address = COALESCE(?, mac_address), status = COALESCE(?, status),
        bandwidth_mbps = COALESCE(?, bandwidth_mbps)
      WHERE id = ?
    `, [nombre || null, codigo || null, parroquia_id || null, ip_address || null, mac_address || null, status || null, bandwidth_mbps || null, req.params.id]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/access-points/:id', authMiddleware, async (req: any, res) => {
    try { await execute('DELETE FROM access_points WHERE id = ?', [req.params.id]); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// DASHBOARD
// ======================
app.get('/api/dashboard/stats', authMiddleware, async (req: any, res) => {
    try {
        const { where: sw, params: sp } = buildScopeFilter(req.admin, 'u');
        const { where: aw, params: ap } = buildScopeFilter(req.admin, 'ap');
        const [totalUsersR, activeUsersR, totalAPsR, activeAPsR, connectedR, newTodayR] = await Promise.all([
            queryOne<any>(`SELECT COUNT(*) as c FROM captive_users u WHERE ${sw}`, sp),
            queryOne<any>(`SELECT COUNT(*) as c FROM captive_users u WHERE ${sw} AND u.is_active = 1`, sp),
            queryOne<any>(`SELECT COUNT(*) as c FROM access_points ap WHERE ${aw}`, ap),
            queryOne<any>(`SELECT COUNT(*) as c FROM access_points ap WHERE ${aw} AND ap.status = 'activo'`, ap),
            queryOne<any>(`SELECT COALESCE(SUM(connected_users),0) as c FROM access_points ap WHERE ${aw} AND ap.status = 'activo'`, ap),
            queryOne<any>(`SELECT COUNT(*) as c FROM captive_users u WHERE ${sw} AND DATE(u.connected_at) = CURDATE()`, sp),
        ]);
        const totalAPs = totalAPsR?.c || 0;
        const activeAPs = activeAPsR?.c || 0;
        res.json({
            totalUsers: totalUsersR?.c || 0,
            activeUsers: activeUsersR?.c || 0,
            totalAPs, activeAPs,
            totalConnected: connectedR?.c || 0,
            newToday: newTodayR?.c || 0,
            uptime: totalAPs > 0 ? Math.round((activeAPs / totalAPs) * 1000) / 10 : 0,
        });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/dashboard/parroquias', authMiddleware, async (req: any, res) => {
    try {
        const { where: aw, params: ap } = buildScopeFilter(req.admin, 'ap');
        res.json(await query(`
      SELECT p.id, p.nombre,
        COUNT(DISTINCT ap.id) as total_aps,
        COUNT(DISTINCT CASE WHEN ap.status='activo' THEN ap.id END) as active_aps,
        COALESCE(SUM(ap.connected_users), 0) as connected_users
      FROM access_points ap
      JOIN parroquias p ON ap.parroquia_id = p.id
      WHERE ${aw}
      GROUP BY p.id ORDER BY connected_users DESC LIMIT 10
    `, ap));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// ADMIN MANAGEMENT (superadmin only)
// ======================
app.get('/api/admins', authMiddleware, superadminOnly, async (req: any, res) => {
    try {
        res.json(await query(`
      SELECT a.id, a.username, a.role, a.nombre_completo, a.email, a.is_active, a.created_at,
        e.nombre as estado_nombre, m.nombre as municipio_nombre
      FROM admin_users a
      LEFT JOIN estados e ON a.estado_id = e.id
      LEFT JOIN municipios m ON a.municipio_id = m.id
      ORDER BY a.created_at DESC
    `));
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/admins', authMiddleware, superadminOnly, async (req: any, res) => {
    try {
        const { username, password, role, nombre_completo, email, estado_id, municipio_id } = req.body;
        if (!username || !password || !role) return res.status(400).json({ error: 'Datos requeridos' });
        const result = await execute(
            'INSERT INTO admin_users (username, password_hash, role, nombre_completo, email, estado_id, municipio_id) VALUES (?,?,?,?,?,?,?)',
            [username, hashPassword(password), role, nombre_completo || username, email || null, estado_id || null, municipio_id || null]
        );
        res.json({ ok: true, id: result.insertId });
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Usuario ya existe' });
        res.status(500).json({ error: 'Error al crear administrador' });
    }
});

app.put('/api/admins/:id', authMiddleware, superadminOnly, async (req: any, res) => {
    try {
        const { password, nombre_completo, email, is_active, estado_id, municipio_id } = req.body;
        await execute(`
      UPDATE admin_users SET
        password_hash = CASE WHEN ? IS NOT NULL THEN ? ELSE password_hash END,
        nombre_completo = COALESCE(?, nombre_completo),
        email = COALESCE(?, email),
        is_active = COALESCE(?, is_active),
        estado_id = ?,
        municipio_id = ?
      WHERE id = ?
    `, [password || null, password ? hashPassword(password) : null, nombre_completo || null, email || null, is_active !== undefined ? is_active : null, estado_id || null, municipio_id || null, req.params.id]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/admins/:id', authMiddleware, superadminOnly, async (req: any, res) => {
    try { await execute("DELETE FROM admin_users WHERE id = ? AND role != 'superadmin'", [req.params.id]); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: 'Error' }); }
});

// ======================
// STATIC FRONTEND (production)
// ======================
const distPath = path.join(__dirname, 'dist');
try {
    // Serve built Vite frontend if dist/ exists
    app.use(express.static(distPath));
    // SPA fallback — all non-API routes return index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} catch (_) { /* dist/ not available in dev */ }

// ======================
// INIT & START
// ======================
async function main() {
    try {
        await waitForDB();          // retry up to 10× before failing
        await initializeSchema();
        await seedDatabase();
        app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API server running on http://0.0.0.0:${PORT}`));
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

main();
