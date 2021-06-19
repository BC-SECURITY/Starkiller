/* global __static */
import {
  app, protocol, BrowserWindow, shell, ipcMain,
} from 'electron';
import path from 'path';
import {
  createProtocol,
} from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';

const Store = require('electron-store');

Store.initRenderer();

const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
      webSecurity: false,
      icon: path.join(__static, 'icon.png'),
    },
  });
  win.maximize();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });

  // don't allow new windows to spawn with center click.
  // if its not an internal link, open with external browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    // config.fileProtocol is my custom file protocol
    if (url.startsWith('//localhost')) {
      return { action: 'allow' };
    }
    // open url in a browser and prevent default
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

const agentWindows = {};
ipcMain.on('agentWindowOpen', (e, data) => {
  if (agentWindows[data.id]) {
    return;
  }

  let spawnedWin = new BrowserWindow({
    x: win.getPosition()[0] + 50,
    y: win.getPosition()[1] + 50,
    width: 600,
    height: 600,
    frameless: true,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
      webSecurity: false,
      icon: path.join(__static, 'icon.png'),
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    spawnedWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}#/agents/${data.id}?hideSideBar=true`);
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    spawnedWin.loadURL(`app://./index.html#/agents/${data.id}?hideSideBar=true`);
  }
  spawnedWin.setTitle(`Agent ${data.id}`);

  spawnedWin.on('page-title-updated', (evt) => {
    evt.preventDefault();
  });

  spawnedWin.on('closed', () => {
    spawnedWin = null;
    delete agentWindows[data.id];
  });

  // don't allow new windows to spawn with center click.
  // if its not an internal link, open with external browser.
  spawnedWin.webContents.setWindowOpenHandler(({ url }) => {
    // config.fileProtocol is my custom file protocol
    if (url.startsWith('//localhost')) {
      return { action: 'allow' };
    }
    // open url in a browser and prevent default
    shell.openExternal(url);
    return { action: 'deny' };
  });

  agentWindows[data.id] = spawnedWin;
});

ipcMain.on('closeAllAgentWindows', () => {
  Object.values(agentWindows).forEach((window) => window.close());
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
