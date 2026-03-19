import { join } from "node:path";
import { app, BrowserWindow, clipboard, ipcMain, globalShortcut, Notification, Tray } from "electron";
import Position from "electron-positioner";

let tray: Tray | null = null;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minHeight: 400,
    minWidth: 300,
    maxHeight: 800,
    maxWidth: 450,
    maximizable: false,
    show: false,
    titleBarStyle: "hidden",
    titleBarOverlay: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // mainWindow.webContents.openDevTools({ mode: "detach" });

  return mainWindow;
};

app.on("ready", () => {
  const browserWindow = createWindow();

  tray = new Tray("./src/icons/trayTemplate.png");
  tray.setIgnoreDoubleClickEvents(true);

  const positioner = new Position(browserWindow);

  tray.on("click", () => {
    if (!tray) return;
    if (browserWindow.isVisible()) {
      browserWindow.hide();
      return;
    }

    const trayPosition = positioner.calculate("trayCenter", tray.getBounds());
    browserWindow.setPosition(trayPosition.x, trayPosition.y);
    browserWindow.show();
  });

  // const contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: "Show window",
  //     click: () => {
  //       app.focus();
  //       browserWindow.show();
  //       browserWindow.focus();
  //     },
  //   },
  //   {
  //     label: "Quit",
  //     role: "quit",
  //   },
  // ]);
  // tray.setContextMenu(contextMenu);

  globalShortcut.register("CommandOrControl+Shift+Alt+C", () => {
    app.focus();
    browserWindow.show();
    browserWindow.focus();
  });

  globalShortcut.register("CommandOrControl+Shift+Alt+V", () => {
    const clipboardText = clipboard.readText();
    if (clipboardText) {
      new Notification({
        title: "Clipboard Content",
        body: clipboardText,
      }).show();
    }
  });
});

app.on("quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("write-to-clipboard", (_, data: string) => {
  clipboard.writeText(data);
});

ipcMain.handle("read-from-clipboard", (_) => {
  return clipboard.readText();
});
