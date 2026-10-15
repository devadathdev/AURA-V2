import { app, BrowserWindow, Menu, Tray, nativeImage, shell, session } from 'electron';
import { fork } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let serverProcess = null;
let serverPort = null;
let isQuitting = false;

const SERVER_HOST = '127.0.0.1';

function createTrayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#071414"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="#2EE6C5" stroke-width="2"/>
    <circle cx="16" cy="16" r="3" fill="#2EE6C5"/>
  </svg>`;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();

    probe.once('error', reject);
    probe.listen(0, SERVER_HOST, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(port, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://${SERVER_HOST}:${port}/`);
      if (response.ok || response.status < 500) return;
    } catch {
      // Server is still starting.
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error(`AURA server did not become ready within ${timeoutMs}ms`);
}

function startAuraServer() {
  const serverEntry = app.isPackaged
    ? path.join(app.getAppPath(), 'server.js')
    : path.join(__dirname, '..', 'server.js');

  serverPort = Number(process.env.AURA_DESKTOP_PORT) || findFreePort();

  return Promise.resolve(serverPort).then(port => {
    serverPort = port;

    serverProcess = fork(serverEntry, [], {
      cwd: app.getAppPath(),
      silent: true,
      execPath: process.execPath,
      env: {
        ...process.env,
        PORT: String(serverPort),
        ELECTRON_RUN_AS_NODE: '1'
      }
    });

    serverProcess.stdout?.on('data', data => {
      console.log(`[AURA server] ${String(data).trim()}`);
    });

    serverProcess.stderr?.on('data', data => {
      console.error(`[AURA server] ${String(data).trim()}`);
    });

    serverProcess.on('error', error => {
      console.error('[AURA server] process error:', error);
    });

    serverProcess.on('exit', (code, signal) => {
      if (!isQuitting) {
        console.error(`[AURA server] exited unexpectedly (code=${code}, signal=${signal})`);
      }
    });

    return waitForServer(serverPort);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#050909',
    title: 'AURA',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://${SERVER_HOST}:${serverPort}`)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('close', event => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return mainWindow.loadURL(`http://${SERVER_HOST}:${serverPort}/`);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('AURA');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show AURA',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: 'Reload AURA',
      click: () => mainWindow?.reload()
    },
    { type: 'separator' },
    {
      label: 'Quit AURA',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function stopAuraServer() {
  if (!serverProcess || serverProcess.killed) return;

  try {
    serverProcess.kill();
  } catch (error) {
    console.error('[AURA server] shutdown error:', error);
  }

  serverProcess = null;
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    const allowed = url.startsWith(`http://${SERVER_HOST}:${serverPort}`);
    callback(allowed && ['media', 'notifications'].includes(permission));
  });

  try {
    await startAuraServer();
    await createWindow();
    createTray();
  } catch (error) {
    console.error('[AURA desktop] startup failed:', error);
    stopAuraServer();
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopAuraServer();
});

app.on('window-all-closed', () => {
  // Keep AURA available from the system tray on Windows.
});
