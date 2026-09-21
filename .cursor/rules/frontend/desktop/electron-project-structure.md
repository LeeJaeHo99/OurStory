# Electron Project Structure

Electron + React + Tailwind 프로젝트 구조 및 설정입니다.

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install -D electron electron-builder electron-main-hmr
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

개발: `npm run dev`(Vite :5173) + 다른 터미널 `npm run dev:electron`  
한 번에: `npm start`

---

## 폴더 구조

```
my-app/
├── src/
│   ├── main/                    # 메인 프로세스
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   ├── ipc/                 # file / window / app.ipc.ts
│   │   └── windows/main-window.ts
│   ├── renderer/                # React
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── pages/               # *.page.tsx
│   │   ├── components/ui|common/
│   │   ├── hooks/               # use-ipc, use-file-dialog…
│   │   ├── stores/              # Zustand
│   │   ├── types/
│   │   ├── styles/              # globals.css, tailwind
│   │   └── utils/
│   └── shared/                  # ipc-channels.ts, types.ts
├── public/                      # icon.png, icon.icns
├── electron/icon/               # 빌드용 png / icns / ico
├── dist-electron/               # 메인 빌드 출력
├── dist/                        # React 빌드 출력
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── electron-builder.yml
└── package.json
```

---

## vite · TypeScript · Tailwind

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
});
```

```json
// tsconfig.json (요지)
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

```css
/* renderer/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  -webkit-app-region: drag;
  user-select: none;
}
button, input, textarea, select {
  -webkit-app-region: no-drag;
  user-select: auto;
}
```

---

## 메인 프로세스

```typescript
// src/main/main.ts
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  registerIpcHandlers();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
```

```typescript
// src/main/utils.ts
export const isDev = process.env.NODE_ENV === 'development';

export function getElectronAppPath(name: string): string {
  const { app } = require('electron');
  if (name === 'userData' || name === 'documents' || name === 'home') {
    return app.getPath(name);
  }
  return '';
}
```

---

## Preload · IPC

```typescript
// src/main/preload.ts
contextBridge.exposeInMainWorld('ipcApi', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
    return () => ipcRenderer.removeListener(channel, callback);
  },
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
});

declare global {
  interface Window {
    ipcApi: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: Function) => () => void;
      send: (channel: string, ...args: any[]) => void;
    };
  }
}
```

```typescript
// src/shared/ipc-channels.ts
export const IPC_CHANNELS = {
  FILE: { OPEN: 'file:open', SAVE: 'file:save', READ: 'file:read', WRITE: 'file:write' },
  WINDOW: { MINIMIZE: 'window:minimize', MAXIMIZE: 'window:maximize', CLOSE: 'window:close' },
  APP: { GET_VERSION: 'app:get-version', GET_PATH: 'app:get-path' },
};
```

```typescript
// src/main/ipc/index.ts
export function registerIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.FILE.READ, async (_e, filePath: string) => {
    try {
      return { success: true, data: fs.readFileSync(filePath, 'utf-8') };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE.WRITE, async (_e, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP.GET_VERSION, () => app.getVersion());
}
```

---

## Renderer (React)

```typescript
// renderer/index.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// App.tsx
<div className="flex h-screen flex-col bg-white">
  <WindowControls />
  <div className="flex-1 overflow-auto">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  </div>
</div>
```

---

## package.json Scripts

```json
{
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "dev:electron": "electron .",
    "build": "vite build",
    "build:electron": "tsc src/main/main.ts --outDir dist-electron --module commonjs",
    "start": "npm run build && npm run build:electron && electron .",
    "dist": "npm run build && npm run build:electron && electron-builder",
    "dist:win": "npm run dist -- --win",
    "dist:mac": "npm run dist -- --mac",
    "dist:linux": "npm run dist -- --linux",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "zustand": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "electron": "latest",
    "electron-builder": "latest",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}
```

---

## 규칙

### DO
- 메인 / 렌더러 분리, Preload + `contextIsolation`
- IPC 채널은 `shared` 상수, 핸들러는 `main/ipc/`에 구조화
- TypeScript, React Router, Tailwind
- `nodeIntegration: false`

### DON'T
- `nodeIntegration` 활성화, Preload 없이 무분별 IPC 노출
- 메인에서 무거운 작업, 채널 문자열 하드코딩
- 전역 변수·타입 없이 IPC 사용
