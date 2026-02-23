import { query, queryOne, execute } from './database.js';
import { PASSWORD_SALT } from '../server.js';
import crypto from 'crypto';

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + PASSWORD_SALT).digest('hex');
}

export async function seedDatabase(): Promise<void> {
    // Check if already seeded
    const row = await queryOne<{ c: number }>('SELECT COUNT(*) AS c FROM estados');
    if (row && row.c > 0) {
        console.log('✅ Database already seeded');
        return;
    }

    console.log('🌱 Seeding database...');

    // --- ESTADOS ---
    const estados = [
        [1, 'Amazonas', 'VE-X'], [2, 'Anzoátegui', 'VE-B'], [3, 'Apure', 'VE-C'],
        [4, 'Aragua', 'VE-D'], [5, 'Barinas', 'VE-E'], [6, 'Bolívar', 'VE-F'],
        [7, 'Carabobo', 'VE-G'], [8, 'Cojedes', 'VE-H'], [9, 'Delta Amacuro', 'VE-Y'],
        [10, 'Falcón', 'VE-I'], [11, 'Guárico', 'VE-J'], [12, 'Lara', 'VE-K'],
        [13, 'Mérida', 'VE-L'], [14, 'Miranda', 'VE-M'], [15, 'Monagas', 'VE-N'],
        [16, 'Nueva Esparta', 'VE-O'], [17, 'Portuguesa', 'VE-P'], [18, 'Sucre', 'VE-R'],
        [19, 'Táchira', 'VE-S'], [20, 'Trujillo', 'VE-T'], [21, 'La Guaira', 'VE-W'],
        [22, 'Yaracuy', 'VE-U'], [23, 'Zulia', 'VE-V'], [24, 'Distrito Capital', 'VE-A'],
        [25, 'Dependencias Federales', 'VE-Z'],
    ];
    for (const e of estados) {
        await execute('INSERT IGNORE INTO estados (id, nombre, iso) VALUES (?, ?, ?)', e);
    }

    // --- MUNICIPIOS ---
    const municipios = [
        [1, 1, 'Alto Orinoco'], [2, 1, 'Atabapo'], [3, 1, 'Atures'], [4, 1, 'Autana'], [5, 1, 'Manapiare'],
        [6, 1, 'Maroa'], [7, 1, 'Río Negro'],
        [8, 2, 'Anaco'], [9, 2, 'Aragua'], [10, 2, 'Manuel Ezequiel Bruzual'], [11, 2, 'Diego Bautista Urbaneja'],
        [12, 2, 'Fernando Peñalver'], [13, 2, 'Francisco Del Carmen Carvajal'], [14, 2, 'General Sir Arthur McGregor'],
        [15, 2, 'Guanta'], [16, 2, 'Independencia'], [17, 2, 'José Gregorio Monagas'], [18, 2, 'Juan Antonio Sotillo'],
        [19, 2, 'Juan Manuel Cajigal'], [20, 2, 'Libertad'], [21, 2, 'Francisco de Miranda'], [22, 2, 'Pedro María Freites'],
        [23, 2, 'Píritu'], [24, 2, 'San José de Guanipa'], [25, 2, 'San Juan de Capistrano'], [26, 2, 'Santa Ana'],
        [27, 2, 'Simón Bolívar'], [28, 2, 'Simón Rodríguez'],
        [29, 3, 'Achaguas'], [30, 3, 'Biruaca'], [31, 3, 'Muñóz'], [32, 3, 'Páez'], [33, 3, 'Pedro Camejo'],
        [34, 3, 'Rómulo Gallegos'], [35, 3, 'San Fernando'],
        [36, 4, 'Atanasio Girardot'], [37, 4, 'Bolívar'], [38, 4, 'Camatagua'], [39, 4, 'Francisco Linares Alcántara'],
        [40, 4, 'José Ángel Lamas'], [41, 4, 'José Félix Ribas'], [42, 4, 'José Rafael Revenga'],
        [43, 4, 'Libertador'], [44, 4, 'Mario Briceño Iragorry'], [45, 4, 'Ocumare de la Costa de Oro'],
        [46, 4, 'San Casimiro'], [47, 4, 'San Sebastián'], [48, 4, 'Santiago Mariño'], [49, 4, 'Santos Michelena'],
        [50, 4, 'Sucre'], [51, 4, 'Tovar'], [52, 4, 'Urdaneta'], [53, 4, 'Zamora'],
        [54, 5, 'Alberto Arvelo Torrealba'], [55, 5, 'Andrés Eloy Blanco'], [56, 5, 'Antonio José de Sucre'],
        [57, 5, 'Arismendi'], [58, 5, 'Barinas'], [59, 5, 'Bolívar'], [60, 5, 'Cruz Paredes'],
        [61, 5, 'Ezequiel Zamora'], [62, 5, 'Obispos'], [63, 5, 'Pedraza'], [64, 5, 'Rojas'], [65, 5, 'Sosa'],
        [66, 6, 'Caroní'], [67, 6, 'Cedeño'], [68, 6, 'El Callao'], [69, 6, 'Gran Sabana'], [70, 6, 'Heres'],
        [71, 6, 'Piar'], [72, 6, 'Angostura (Raúl Leoni)'], [73, 6, 'Roscio'], [74, 6, 'Sifontes'],
        [75, 6, 'Sucre'], [76, 6, 'Padre Pedro Chien'],
        [77, 7, 'Bejuma'], [78, 7, 'Carlos Arvelo'], [79, 7, 'Diego Ibarra'], [80, 7, 'Guacara'],
        [81, 7, 'Juan José Mora'], [82, 7, 'Libertador'], [83, 7, 'Los Guayos'], [84, 7, 'Miranda'],
        [85, 7, 'Montalbán'], [86, 7, 'Naguanagua'], [87, 7, 'Puerto Cabello'], [88, 7, 'San Diego'],
        [89, 7, 'San Joaquín'], [90, 7, 'Valencia'],
        [91, 8, 'Anzoátegui'], [92, 8, 'Tinaquillo'], [93, 8, 'Girardot'], [94, 8, 'Lima Blanco'],
        [95, 8, 'Pao de San Juan Bautista'], [96, 8, 'Ricaurte'], [97, 8, 'Rómulo Gallegos'],
        [98, 8, 'San Carlos'], [99, 8, 'Tinaco'],
        [100, 9, 'Antonio Díaz'], [101, 9, 'Casacoima'], [102, 9, 'Pedernales'], [103, 9, 'Tucupita'],
        [104, 10, 'Acosta'], [105, 10, 'Bolívar'], [106, 10, 'Buchivacoa'], [107, 10, 'Cacique Manaure'],
        [108, 10, 'Carirubana'], [109, 10, 'Colina'], [110, 10, 'Dabajuro'], [111, 10, 'Democracia'],
        [112, 10, 'Falcón'], [113, 10, 'Federación'], [114, 10, 'Jacura'], [115, 10, 'José Laurencio Silva'],
        [116, 10, 'Los Taques'], [117, 10, 'Mauroa'], [118, 10, 'Miranda'], [119, 10, 'Monseñor Iturriza'],
        [120, 10, 'Palmasola'], [121, 10, 'Petit'], [122, 10, 'Píritu'], [123, 10, 'San Francisco'],
        [124, 10, 'Sucre'], [125, 10, 'Tocópero'], [126, 10, 'Unión'], [127, 10, 'Urumaco'], [128, 10, 'Zamora'],
        [129, 11, 'Camaguán'], [130, 11, 'Chaguaramas'], [131, 11, 'El Socorro'], [132, 11, 'José Félix Ribas'],
        [133, 11, 'José Tadeo Monagas'], [134, 11, 'Juan Germán Roscio'], [135, 11, 'Julián Mellado'],
        [136, 11, 'Las Mercedes'], [137, 11, 'Leonardo Infante'], [138, 11, 'Pedro Zaraza'],
        [139, 11, 'Ortíz'], [140, 11, 'San Gerónimo de Guayabal'], [141, 11, 'San José de Guaribe'],
        [142, 11, 'Santa María de Ipire'], [143, 11, 'Sebastián Francisco de Miranda'],
        [144, 12, 'Andrés Eloy Blanco'], [145, 12, 'Crespo'], [146, 12, 'Iribarren'], [147, 12, 'Jiménez'],
        [148, 12, 'Morán'], [149, 12, 'Palavecino'], [150, 12, 'Simón Planas'], [151, 12, 'Torres'], [152, 12, 'Urdaneta'],
        // Mérida (estado 13)
        [179, 13, 'Alberto Adriani'], [180, 13, 'Andrés Bello'], [181, 13, 'Antonio Pinto Salinas'],
        [182, 13, 'Aricagua'], [183, 13, 'Arzobispo Chacón'], [184, 13, 'Campo Elías'],
        [185, 13, 'Caracciolo Parra Olmedo'], [186, 13, 'Cardenal Quintero'], [187, 13, 'Guaraque'],
        [188, 13, 'Julio César Salas'], [189, 13, 'Justo Briceño'], [190, 13, 'Libertador'],
        [191, 13, 'Miranda'], [192, 13, 'Obispo Ramos de Lora'], [193, 13, 'Padre Noguera'],
        [194, 13, 'Pueblo Llano'], [195, 13, 'Rangel'], [196, 13, 'Rivas Dávila'],
        [197, 13, 'Santos Marquina'], [198, 13, 'Sucre'], [199, 13, 'Tovar'],
        [200, 13, 'Tulio Febres Cordero'], [201, 13, 'Zea'],
        [223, 14, 'Acevedo'], [224, 14, 'Andrés Bello'], [225, 14, 'Baruta'], [226, 14, 'Brión'],
        [227, 14, 'Buroz'], [228, 14, 'Carrizal'], [229, 14, 'Chacao'], [230, 14, 'Cristóbal Rojas'],
        [231, 14, 'El Hatillo'], [232, 14, 'Guaicaipuro'], [233, 14, 'Independencia'], [234, 14, 'Lander'],
        [235, 14, 'Los Salias'], [236, 14, 'Páez'], [237, 14, 'Paz Castillo'], [238, 14, 'Pedro Gual'],
        [239, 14, 'Plaza'], [240, 14, 'Simón Bolívar'], [241, 14, 'Sucre'], [242, 14, 'Urdaneta'], [243, 14, 'Zamora'],
        [258, 15, 'Acosta'], [259, 15, 'Aguasay'], [260, 15, 'Bolívar'], [261, 15, 'Caripe'], [262, 15, 'Cedeño'],
        [263, 15, 'Ezequiel Zamora'], [264, 15, 'Libertador'], [265, 15, 'Maturín'], [266, 15, 'Piar'],
        [267, 15, 'Punceres'], [268, 15, 'Santa Bárbara'], [269, 15, 'Sotillo'], [270, 15, 'Uracoa'],
        [281, 16, 'Díaz'], [271, 16, 'Antolín del Campo'], [272, 16, 'Arismendi'], [273, 16, 'García'],
        [274, 16, 'Gómez'], [275, 16, 'Maneiro'], [276, 16, 'Marcano'], [277, 16, 'Mariño'],
        [278, 16, 'Península de Macanao'], [279, 16, 'Tubores'], [280, 16, 'Villalba'],
        [282, 17, 'Agua Blanca'], [283, 17, 'Araure'], [284, 17, 'Esteller'], [285, 17, 'Guanare'],
        [286, 17, 'Guanarito'], [287, 17, 'Monseñor José Vicente de Unda'], [288, 17, 'Ospino'],
        [289, 17, 'Páez'], [290, 17, 'Papelón'], [291, 17, 'San Genaro de Boconoíto'],
        [292, 17, 'San Rafael de Onoto'], [293, 17, 'Santa Rosalía'], [294, 17, 'Sucre'], [295, 17, 'Turén'],
        [296, 18, 'Andrés Eloy Blanco'], [297, 18, 'Andrés Mata'], [298, 18, 'Arismendi'], [299, 18, 'Benítez'],
        [300, 18, 'Bermúdez'], [301, 18, 'Bolívar'], [302, 18, 'Cajigal'], [303, 18, 'Cruz Salmerón Acosta'],
        [304, 18, 'Libertador'], [305, 18, 'Mariño'], [306, 18, 'Mejía'], [307, 18, 'Montes'],
        [308, 18, 'Ribero'], [309, 18, 'Sucre'], [310, 18, 'Valdez'],
        [311, 19, 'Andrés Bello'], [312, 19, 'Antonio Rómulo Costa'], [313, 19, 'Ayacucho'], [314, 19, 'Bolívar'],
        [315, 19, 'Cárdenas'], [316, 19, 'Córdoba'], [317, 19, 'Fernández Feo'], [318, 19, 'Francisco de Miranda'],
        [319, 19, 'García de Hevia'], [320, 19, 'Guásimos'], [321, 19, 'Independencia'], [322, 19, 'Jáuregui'],
        [323, 19, 'José María Vargas'], [324, 19, 'Junín'], [325, 19, 'Libertad'], [326, 19, 'Libertador'],
        [327, 19, 'Lobatera'], [328, 19, 'Michelena'], [329, 19, 'Panamericano'], [330, 19, 'Pedro María Ureña'],
        [331, 19, 'Rafael Urdaneta'], [332, 19, 'Samuel Darío Maldonado'], [333, 19, 'San Cristóbal'],
        [334, 19, 'Seboruco'], [335, 19, 'Simón Bolívar'], [336, 19, 'Sucre'], [337, 19, 'Torbes'], [338, 19, 'Uribante'],
        [339, 20, 'Andrés Bello'], [340, 20, 'Boconó'], [341, 20, 'Candelaria'], [342, 20, 'Carache'],
        [343, 20, 'Escuque'], [344, 20, 'José Felipe Márquez Cañizales'], [345, 20, 'Juan Vicente Campos Elías'],
        [346, 20, 'La Ceiba'], [347, 20, 'Miranda'], [348, 20, 'Motatán'], [349, 20, 'Pampán'], [350, 20, 'Pampanito'],
        [351, 20, 'Rafael Rangel'], [352, 20, 'Sucre'], [353, 20, 'Trujillo'], [354, 20, 'Urdaneta'], [355, 20, 'Valera'],
        [356, 21, 'Vargas'], [357, 22, 'Bolívar'], [358, 22, 'Bruzual'], [359, 22, 'Manuel Monge'],
        [360, 22, 'Pablo Lander'], [361, 22, 'Peña'], [362, 22, 'San Felipe'], [363, 22, 'Sucre'],
        [364, 22, 'Urachiche'], [365, 22, 'Veroes'],
        [366, 23, 'Almirante Padilla'], [367, 23, 'Baralt'], [368, 23, 'Cabimas'], [369, 23, 'Catatumbo'],
        [370, 23, 'Colón'], [371, 23, 'Francisco Javier Pulgar'], [372, 23, 'Guajira'], [373, 23, 'Jesús Enrique Lossada'],
        [374, 23, 'Jesús María Semprún'], [375, 23, 'La Cañada de Urdaneta'], [376, 23, 'Lagunillas'],
        [377, 23, 'Machiques de Perijá'], [378, 23, 'Mara'], [379, 23, 'Maracaibo'], [380, 23, 'Miranda'],
        [381, 23, 'Páez'], [382, 23, 'Rosario de Perijá'], [383, 23, 'San Francisco'], [384, 23, 'Santa Rita'],
        [385, 23, 'Simón Bolívar'], [386, 23, 'Sucre'], [387, 23, 'Valmore Rodríguez'],
        [388, 24, 'Libertador'],
        [389, 25, 'Dependencias Federales'],
    ];
    for (const m of municipios) {
        await execute('INSERT IGNORE INTO municipios (id, estado_id, nombre) VALUES (?, ?, ?)', m);
    }

    // --- PARROQUIAS (Mérida - Municipio Libertador id=190 y otros) ---
    const parroquias = [
        [190, 'El Sagrario'], [190, 'El Llano'], [190, 'Arias'], [190, 'Milla'],
        [190, 'Ayacucho'], [190, 'Domingo Peña'], [190, 'El Marqués'], [190, 'Osuna Rodríguez'],
        [190, 'Caracciolo Parra Pérez'], [190, 'Juan Rodríguez Suárez'],
        [184, 'La Punta'], [184, 'Montalbán'], [184, 'San Juan'],
        [179, 'El Vigía'], [179, 'Presidente Páez'],
        [197, 'Tabay'], [197, 'La Mucuy'],
        [195, 'Mucuchíes'], [195, 'Gavidia'],
    ];
    for (const p of parroquias) {
        await execute('INSERT INTO parroquias (municipio_id, nombre) VALUES (?, ?)', p);
    }

    // --- SUPERADMIN ---
    const existingAdmin = await queryOne('SELECT id FROM admin_users WHERE username = ?', ['admin']);
    if (!existingAdmin) {
        await execute(
            `INSERT INTO admin_users (username, password_hash, role, nombre_completo, email) VALUES (?, ?, 'superadmin', 'Super Administrador', 'admin@amarillo.ve')`,
            ['admin', hashPassword('admin123')]
        );
        console.log('✅ Superadmin created: admin / admin123');
    }

    // --- PORTAL CONFIG ---
    const configs: [string, string][] = [
        ['consent_title', 'Tratamiento de Datos'],
        ['consent_body', 'Al conectarse a esta red WiFi pública, usted acepta nuestros términos de privacidad y el uso de sus datos para fines estadísticos de conectividad pública, conforme a la legislación venezolana vigente.'],
        ['welcome_message', 'Ingresa tus datos para navegar gratis en la red pública.'],
        ['session_duration_minutes', '120'],
        ['network_name', 'Mérida te conecta'],
    ];
    for (const [k, v] of configs) {
        await execute('INSERT IGNORE INTO portal_config (`key`, value) VALUES (?, ?)', [k, v]);
    }

    // --- PREGUNTAS DE SEGURIDAD ---
    const questions: [string, string, string | null][] = [
        ['¿Cuánto es 5 + 3?', 'matematica', '8'],
        ['¿Cuánto es 12 - 4?', 'matematica', '8'],
        ['¿Cuánto es 7 + 6?', 'matematica', '13'],
        ['¿Cuánto es 20 ÷ 4?', 'matematica', '5'],
        ['¿Cuánto es 3 × 3?', 'matematica', '9'],
        ['¿Cuánto es 15 - 7?', 'matematica', '8'],
        ['¿Cómo calificarías la calidad del WiFi público?', 'abierta', null],
        ['¿Es esta su primera vez usando esta red?', 'abierta', null],
    ];
    for (const [texto, tipo, resp] of questions) {
        await execute('INSERT INTO questions (texto, tipo, respuesta_correcta) VALUES (?, ?, ?)', [texto, tipo, resp]);
    }

    // --- SAMPLE ACCESS POINTS (parroquias 1-5 after insert above) ---
    // Get the first few parroquia IDs dynamically
    const pars = await query<{ id: number }>('SELECT id FROM parroquias ORDER BY id LIMIT 7');
    if (pars.length >= 5) {
        const apData = [
            ['Plaza Bolívar Sagrario', 'AP-PLZ-BOL-01', pars[0].id, '192.168.1.1', 'AA:BB:CC:01:01:01', 'activo', -62, 142],
            ['Parque Las Heroínas', 'AP-PRQ-HER-01', pars[0].id, '192.168.1.2', 'AA:BB:CC:01:01:02', 'activo', -68, 89],
            ['Mercado Principal', 'AP-MRC-PRL-01', pars[1].id, '192.168.1.3', 'AA:BB:CC:01:02:01', 'mantenimiento', -75, 0],
            ['Av. Universidad', 'AP-AVU-UNI-01', pars[3].id, '192.168.1.4', 'AA:BB:CC:01:04:01', 'activo', -60, 215],
            ['Centro Comercial Las Tapias', 'AP-CCT-TAP-01', pars[2].id, '192.168.1.5', 'AA:BB:CC:01:03:01', 'activo', -65, 98],
            ['Hospital Universitario', 'AP-HSP-UNI-01', pars[4].id, '192.168.1.6', 'AA:BB:CC:01:05:01', 'activo', -58, 176],
            ['Parque Beethoven', 'AP-PRQ-BET-01', pars[1].id, '192.168.1.7', 'AA:BB:CC:01:02:02', 'inactivo', -90, 0],
        ];
        for (const ap of apData) {
            await execute(
                'INSERT IGNORE INTO access_points (nombre, codigo, parroquia_id, ip_address, mac_address, status, signal_dbm, connected_users) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ap
            );
        }

        // --- SAMPLE CAPTIVE USERS ---
        const sampleUsers = [
            ['Juan Pérez', 'V-12345678', '+58412-1234567', '1990-05-15', 'Av. Universidad, Mérida', pars[0].id],
            ['María González', 'V-15987654', '+58414-7654321', '1985-08-22', 'Calle 24, Sector El Llano', pars[1].id],
            ['Carlos Rodríguez', 'V-18222333', '+58424-9876543', '1995-03-10', 'Urb. Las Tapias, Casa 5', pars[2].id],
            ['Ana López', 'V-20111444', '+58416-5554433', '1992-11-30', 'Sector Milla, Calle 8', pars[3].id],
            ['Ricardo Mendoza', 'V-25000999', '+58412-0001122', '1988-07-18', 'Plaza Bolivar, Sagrario', pars[0].id],
        ];
        for (const u of sampleUsers) {
            await execute(
                'INSERT IGNORE INTO captive_users (nombre_completo, cedula, whatsapp, fecha_nacimiento, direccion, parroquia_id) VALUES (?, ?, ?, ?, ?, ?)',
                u
            );
        }
    }

    console.log('✅ Database seeded successfully');
}
