const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const axios = require('axios');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 800,
        frame: false,
        backgroundColor: '#000000',
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Detectar si estamos en desarrollo o producción
    const isDev = !app.isPackaged;

    if (isDev) {
        // En desarrollo usamos el servidor de Vite
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        // En producción cargamos el archivo construido
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- Lógica del LCU Bridge integrada en el proceso Main ---

const findLockfile = () => {
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
    if (!lockfilePath) return null;
    try {
        const content = fs.readFileSync(lockfilePath, 'utf8');
        const [name, pid, port, password, protocol] = content.split(':');
        return { port, password, protocol };
    } catch (e) {
        return null;
    }
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Handler para que el proceso renderer (React) pida el estado del draft
ipcMain.handle('get-lcu-draft', async () => {
    const creds = getCredentials();
    if (!creds) return { error: "Client not found" };

    try {
        const auth = Buffer.from(`riot:${creds.password}`).toString('base64');
        const response = await axios.get(`${creds.protocol}://127.0.0.1:${creds.port}/lol-champ-select/v1/session`, {
            headers: { 'Authorization': `Basic ${auth}` },
            httpsAgent,
            timeout: 2000
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { status: "In Queue or Lobby" };
        }
        return { error: "LCU Error", details: error.message };
    }
});

// Handlers para controles de ventana personalizados
ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('window-close', () => {
    mainWindow.close();
});
