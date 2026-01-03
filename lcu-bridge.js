import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';

const app = express();
const PORT = 3500;

app.use(cors());
app.use(express.json());

// Configuracion de Riot / LCU
let lcuCredentials = null;

const findLockfile = () => {
    // Rutas comunes de instalacion en Windows
    const commonPaths = [
        'C:/Riot Games/League of Legends/lockfile',
        'D:/Riot Games/League of Legends/lockfile',
        'E:/Riot Games/League of Legends/lockfile',
    ];

    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

const getCredentials = () => {
    const lockfilePath = findLockfile();
    if (!lockfilePath) {
        console.log("❌ Lockfile no encontrado. ¿Está el LoL abierto?");
        return null;
    }

    try {
        const content = fs.readFileSync(lockfilePath, 'utf8');
        const [name, pid, port, password, protocol] = content.split(':');
        return { port, password, protocol };
    } catch (e) {
        console.error("❌ Error leyendo lockfile:", e);
        return null;
    }
};

// Trust Riot's self-signed cert
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

app.get('/draft', async (req, res) => {
    const creds = getCredentials();
    if (!creds) {
        return res.status(404).json({ error: "Client not found" });
    }

    try {
        const auth = Buffer.from(`riot:${creds.password}`).toString('base64');
        const response = await axios.get(`${creds.protocol}://127.0.0.1:${creds.port}/lol-champ-select/v1/session`, {
            headers: { 'Authorization': `Basic ${auth}` },
            httpsAgent
        });

        res.json(response.data);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            res.status(200).json({ status: "In Queue or Lobby (No Session)" });
        } else {
            res.status(500).json({ error: "LCU Error", details: error.message });
        }
    }
});

const server = app.listen(PORT, () => {
    console.log("==========================================");
    console.log(`🚀 LCU Bridge running at http://localhost:${PORT}`);
    console.log("==========================================");
    console.log("Instrucciones:");
    console.log("1. Mantén esta ventana abierta.");
    console.log("2. Abre el League of Legends.");
    console.log("3. En el Coach (web), activa 'Live Sync ON'.");
    console.log("==========================================");
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: El puerto ${PORT} ya está siendo usado.`);
        console.error("Es probable que ya tengas otra instancia del Bridge abierta.");
        console.error("Cierra cualquier otra ventana de comandos que esté usando este programa.\n");
    } else {
        console.error("\n❌ Error inesperado:", err.message, "\n");
    }

    console.log("Presiona cualquier tecla para salir...");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit);
});
