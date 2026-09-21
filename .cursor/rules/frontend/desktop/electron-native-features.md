# Electron Native Features

네이티브 기능은 **메인 프로세스**에서만 다루고, 렌더러는 IPC로 호출합니다.  
채널·Preload는 [`electron-ipc-communication.md`](./electron-ipc-communication.md)를 따릅니다.

---

## 파일 시스템

```typescript
// main/ipc/file.ipc.ts — fs/promises
ipcMain.handle(IPC_CHANNELS.FILE.READ, async (_e, filePath) =>
  fs.readFile(filePath, 'utf-8'),
);
ipcMain.handle(IPC_CHANNELS.FILE.WRITE, async (_e, filePath, content) => {
  await fs.writeFile(filePath, content, 'utf-8');
});
ipcMain.handle(IPC_CHANNELS.FILE.EXISTS, async (_e, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});
ipcMain.handle(IPC_CHANNELS.FILE.LIST, async (_e, dirPath) => fs.readdir(dirPath));
ipcMain.handle(IPC_CHANNELS.FILE.DELETE, async (_e, filePath) => fs.unlink(filePath));
ipcMain.handle(IPC_CHANNELS.FILE.STAT, async (_e, filePath) => fs.stat(filePath));
```

경로·입력을 검증하고, 렌더러에서 `fs`를 직접 쓰지 않습니다.

---

## 다이얼로그

```typescript
// open file / directory / save / message
const open = await dialog.showOpenDialog(mainWindow, {
  properties: ['openFile'], // 또는 openDirectory
  filters: [
    { name: 'All Files', extensions: ['*'] },
    { name: 'Text Files', extensions: ['txt', 'md'] },
  ],
  ...options,
});
// canceled ? null : filePaths[0]

const save = await dialog.showSaveDialog(mainWindow, { filters: [...], ...options });
// canceled ? null : filePath

const msg = await dialog.showMessageBox(mainWindow, {
  type: 'info',
  buttons: ['OK', 'Cancel'],
  ...options,
});
// response === 0 → OK
```

```typescript
// renderer: useFileDialog → invoke('dialog:open-file' | open-directory | save-file | show-message)
```

---

## Menu · Tray · Context Menu

```typescript
// Application menu
Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => {} },
        { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => {} },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
      ],
    },
    // View: Reload / DevTools …
  ]),
);

// Context menu — renderer send('show-context-menu') → main popup
ipcMain.on('show-context-menu', (event) => {
  Menu.buildFromTemplate([
    { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
    { type: 'separator' }, { role: 'delete' },
  ]).popup({ window: BrowserWindow.fromWebContents(event.sender)! });
});

// System tray
const tray = new Tray(path.join(__dirname, '../../public/icon.png'));
tray.setContextMenu(
  Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() },
  ]),
);
tray.on('click', () => (mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()));
```

---

## Clipboard

```typescript
ipcMain.handle('clipboard:read-text', () => clipboard.readText());
ipcMain.handle('clipboard:write-text', (_e, text: string) => clipboard.writeText(text));
ipcMain.handle('clipboard:read-image', () => clipboard.readImage().toDataURL());
ipcMain.handle('clipboard:write-image', (_e, dataUrl: string) => {
  clipboard.writeImage(nativeImage.createFromDataURL(dataUrl));
});

// renderer: useClipboard → invoke(...)
```

---

## 드래그&드롭 (렌더러)

UI DropZone은 [`electron-react-components.md`](./electron-react-components.md).  
파일 처리는 IPC로 메인에 위임합니다.

```typescript
const files = Array.from(e.dataTransfer.files);
for (const file of files) {
  await invoke('file:process', await file.text());
}
```

---

## 규칙

### DO
- 파일·클립보드·다이얼로그는 IPC + 비동기
- 경로·입력 검증, 에러 처리
- Menu / Tray는 메인에서 구성

### DON'T
- 렌더러에서 `fs` / `nodeIntegration`
- 무제한 파일 접근, 검증·에러 생략
