# Electron IPC Communication

메인 ↔ 렌더러 안전 통신입니다.  
폴더·기본 Preload 골격은 [`electron-project-structure.md`](./electron-project-structure.md)를 따릅니다.

| 역할 | 담당 |
|------|------|
| 메인 (`ipcMain`) | 파일·윈도우·시스템 |
| 렌더러 | UI, 메인에 요청 |
| Preload (`contextBridge`) | `ipcRenderer`를 안전하게 노출 |

권장: **invoke / handle** (Promise 양방향). 단방향은 **send / on**.

---

## Invoke / Handle

```typescript
// main/ipc/file.ipc.ts
export function registerFileHandlers() {
  ipcMain.handle(IPC_CHANNELS.FILE.READ, async (_e, filePath: string): Promise<string> => {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE.WRITE, async (_e, filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf-8');
  });

  ipcMain.handle(IPC_CHANNELS.FILE.EXISTS, async (_e, filePath: string) =>
    fs.existsSync(filePath),
  );

  ipcMain.handle(IPC_CHANNELS.FILE.DELETE, async (_e, filePath: string) => {
    fs.unlinkSync(filePath);
  });
}
```

```typescript
// preload.ts
contextBridge.exposeInMainWorld('ipcApi', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
    return () => ipcRenderer.removeListener(channel, callback);
  },
  once: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.once(channel, callback);
  },
});
```

```typescript
// renderer/hooks/use-ipc.hook.ts
export function useIpc() {
  return {
    invoke: (...args: Parameters<Window['ipcApi']['invoke']>) =>
      window.ipcApi.invoke(...args),
    send: (...args: Parameters<Window['ipcApi']['send']>) =>
      window.ipcApi.send(...args),
    on: (channel: string, callback: (...args: any[]) => void) =>
      window.ipcApi.on(channel, (_e, ...args) => callback(...args)),
  };
}

const { invoke } = useIpc();
const content = await invoke(IPC_CHANNELS.FILE.READ, '/path/to/file');
```

---

## Send / On (단방향)

```typescript
// 메인 → 렌더러
mainWindow.webContents.send('notification', {
  title: 'Hello from Main!',
  timestamp: new Date(),
});

// 렌더러 → 메인
ipcMain.on('renderer-message', (event, message: string) => {
  console.log('From renderer:', message);
  event.reply('main-response', 'Message received');
});

// 렌더러 구독 (cleanup 필수)
useEffect(() => {
  const unsubscribe = on('notification', (data) => setMessage(data.title));
  return unsubscribe;
}, [on]);

send('renderer-message', 'Hello from Renderer!');
```

---

## 타입 안전 IPC

```typescript
// shared/ipc-channels.ts
export const IPC_CHANNELS = {
  FILE: { READ: 'file:read', WRITE: 'file:write', DELETE: 'file:delete', EXISTS: 'file:exists' },
  WINDOW: { MINIMIZE: 'window:minimize', MAXIMIZE: 'window:maximize', CLOSE: 'window:close' },
  APP: { GET_VERSION: 'app:get-version', OPEN_DEV_TOOLS: 'app:open-dev-tools' },
} as const;

// shared/ipc-types.ts
export type IpcChannelMap = {
  'file:read': { args: [filePath: string]; response: string };
  'file:write': { args: [filePath: string, content: string]; response: void };
  'window:minimize': { args: []; response: void };
  'app:get-version': { args: []; response: string };
};

// use-ipc-typed.hook.ts
export function useIpcTyped() {
  const invoke = async <T extends keyof IpcChannelMap>(
    channel: T,
    ...args: IpcChannelMap[T]['args']
  ): Promise<IpcChannelMap[T]['response']> =>
    window.ipcApi.invoke(channel, ...args);

  return { invoke };
}

const result = await invoke('file:read', '/path/to/file');
```

---

## 에러 · 디버그

```typescript
// 메인: throw → 렌더러 catch
ipcMain.handle('risky-operation', async () => {
  if (!someCondition) throw new Error('Operation failed: invalid condition');
  return { success: true };
});

try {
  await invoke('risky-operation');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unknown error');
}

// 개발: handle 래핑 로깅
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = function (channel: string, listener: any) {
  return originalHandle(channel, async (event, ...args) => {
    console.log(`[IPC] ${channel}`, args);
    try {
      const result = await listener(event, ...args);
      console.log(`[IPC] ${channel} → success`, result);
      return result;
    } catch (error) {
      console.error(`[IPC] ${channel} → error`, error);
      throw error;
    }
  });
};
```

---

## 예제: 파일 다이얼로그

```typescript
// main/ipc/dialog.ipc.ts
ipcMain.handle('dialog:open-file', async (_e, options?: any) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    ...options,
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('dialog:save-file', async (_e, options?: any) => {
  const result = await dialog.showSaveDialog({ ...options });
  return result.filePath || null;
});

// renderer
const filePath = await invoke('dialog:open-file', {
  filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }],
});
```

---

## 규칙 · 보안

### DO
- `invoke`/`handle` 양방향, 채널은 `IPC_CHANNELS` 상수
- Preload + 타입(`IpcChannelMap`), 에러 try/catch
- 입력·경로 검증, 민감 데이터 주의

### DON'T
- `nodeIntegration` 활성화, 채널 하드코딩
- 에러/입력 검증 생략, 무제한 파일 접근
- 타입 없이 IPC 호출

```
[ ] Preload로 API만 노출
[ ] 사용자 입력·파일 경로 검증
[ ] 에러 메시지 최소화
[ ] 민감 데이터 암호화
[ ] IPC 핸들러 권한 확인
```
