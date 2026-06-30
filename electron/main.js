const { app, BrowserWindow, shell, nativeTheme } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Load .env file so GROQ_API_KEY works without terminal tricks
const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

let serverProcess = null;
let mainWindow = null;

const PORT = 3001;
const isDev = !app.isPackaged;

function getBackendPath() {
  if (isDev) return path.join(__dirname, '../backend/server.js');
  return path.join(__dirname, 'staged-backend/server.js');
}

function getNativeModulesPath() {
  if (isDev) return path.join(__dirname, 'node_modules');
  // asar:false puts everything under Resources/app/node_modules
  return path.join(process.resourcesPath, 'app', 'node_modules');
}

function getFrontendDistPath() {
  if (isDev) return path.join(__dirname, '../frontend/dist');
  return path.join(__dirname, 'staged-frontend');
}

function startBackend() {
  return new Promise((resolve) => {
    const dataDir = app.getPath('userData');

    serverProcess = fork(getBackendPath(), [], {
      silent: true,
      env: {
        ...process.env,
        PORT: String(PORT),
        LUNA_DATA_DIR: dataDir,
        ELECTRON_NATIVE_MODULES: getNativeModulesPath(),
        LUNA_STATIC_DIR: getFrontendDistPath(),
      },
    });

    serverProcess.stdout.on('data', (data) => {
      process.stdout.write('[backend] ' + data);
      if (data.toString().includes('running on')) resolve();
    });

    serverProcess.stderr.on('data', (data) => {
      process.stderr.write('[backend err] ' + data);
    });

    serverProcess.on('error', (err) => {
      console.error('Backend failed to start:', err);
      resolve();
    });

    // Safety timeout: proceed after 4s regardless
    setTimeout(resolve, 4000);
  });
}

function waitForServer(retries = 30) {
  return new Promise((resolve) => {
    const tryConnect = () => {
      http.get(`http://localhost:${PORT}/api/profile`, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
        res.resume();
      }).on('error', retry);
    };
    const retry = () => {
      if (retries-- > 0) setTimeout(tryConnect, 200);
      else resolve();
    };
    tryConnect();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 390,
    minHeight: 600,
    title: 'Luna Health',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#FDE8F0',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
  });

  // Show loading placeholder while backend starts
  mainWindow.loadURL(`data:text/html,
    <html style="margin:0;background:#1A0810;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system">
      <div style="text-align:center;color:#F9D8E6">
        <div style="font-size:48px;margin-bottom:16px">🌙</div>
        <p style="font-size:18px;font-weight:700;letter-spacing:-0.5px">Luna Health</p>
        <p style="font-size:12px;color:#9A607A;margin-top:8px">Starting up…</p>
      </div>
    </html>`);

  await startBackend();
  await waitForServer();

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open external links in the default browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// macOS: style the title bar dark to match the sidebar
app.on('ready', () => {
  nativeTheme.themeSource = 'dark';
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
});
