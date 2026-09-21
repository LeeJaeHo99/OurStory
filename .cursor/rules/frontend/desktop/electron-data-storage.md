# Electron Data Storage

로컬 데이터는 메인에서 다루고 IPC로 노출합니다.  
UI 상태 영속화(Zustand `persist`)는 [`electron-state-management.md`](./electron-state-management.md)를 따릅니다.

| 용도 | 선택 |
|------|------|
| 설정·간단 키-값 | **electron-store** (권장) |
| 관계형·대량 데이터 | **better-sqlite3** |
| 비밀번호 등 민감 값 | 암호화 저장 (+ OS 키체인 권장) |

```bash
npm install electron-store
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

---

## electron-store

```typescript
// main/stores/storage.ts
interface StorageSchema {
  user: { id: string; name: string; email: string } | null;
  settings: { theme: 'light' | 'dark'; language: string };
  recentFiles: string[];
}

const store = new Store<StorageSchema>({
  defaults: {
    user: null,
    settings: { theme: 'light', language: 'en' },
    recentFiles: [],
  },
});

store.get('user');
store.set('user', user);
store.set('settings.theme', 'dark');
store.set('recentFiles', [filePath, ...files].slice(0, 10));
```

```typescript
// IPC
ipcMain.handle('storage:get', (_e, key) => store.get(key));
ipcMain.handle('storage:set', (_e, key, value) => store.set(key, value));
ipcMain.handle('storage:delete', (_e, key) => store.delete(key));
ipcMain.handle('storage:clear', () => store.clear());
ipcMain.handle('storage:get-all', () => store.store);

// renderer: useStorage → get / set / remove / clear
```

---

## SQLite (better-sqlite3)

```typescript
const dbPath = path.join(app.getPath('userData'), 'app.db');
export const db = new Database(dbPath);

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
  `);
}

// userDB / fileDB: prepare + run/get/all (create, getById, getAll, update, delete)
```

```typescript
ipcMain.handle('database:init', () => initializeDatabase());
ipcMain.handle('database:user-get-all', () => userDB.getAll());
ipcMain.handle('database:user-get-by-id', (_e, id) => userDB.getById(id));
ipcMain.handle('database:user-create', (_e, user) => userDB.create(user));
ipcMain.handle('database:user-update', (_e, id, user) => userDB.update(id, user));
ipcMain.handle('database:user-delete', (_e, id) => userDB.delete(id));
ipcMain.handle('database:files-get-by-user', (_e, userId) => fileDB.getByUserId(userId));
ipcMain.handle('database:file-create', (_e, file) => fileDB.create(file));
```

### 마이그레이션

```typescript
const migrations = [
  { version: 1, up: () => db.exec(`CREATE TABLE IF NOT EXISTS users (...)`) },
  { version: 2, up: () => db.exec(`ALTER TABLE users ADD COLUMN age INTEGER`) },
];

export function runMigrations() {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (const m of migrations) {
    if (m.version > current) {
      m.up();
      db.pragma(`user_version = ${m.version}`);
    }
  }
}
```

---

## 보안 저장소

마스터 키는 OS 키체인 사용을 권장합니다. 아래는 AES 예시입니다.

```typescript
// encrypt: iv + aes-256-cbc → `iv:hex:ciphertext`
// decrypt: split → createDecipheriv
setSecure(key, value); // store `secure_${key}`
getSecure(key);

ipcMain.handle('secure-storage:set', (_e, key, value) => secureStorage.setSecure(key, value));
ipcMain.handle('secure-storage:get', (_e, key) => secureStorage.getSecure(key));
```

평문 비밀번호 저장 금지.

---

## 백업 · 복구

```typescript
ipcMain.handle('backup:create', async () => {
  const backupDir = path.join(app.getPath('userData'), 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `backup-${date}.json`);
  await fs.writeFile(backupFile, JSON.stringify(store.store, null, 2));
  return backupFile;
});

ipcMain.handle('backup:restore', async (_e, backupPath: string) => {
  const data = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
  Object.entries(data).forEach(([key, value]) => store.set(key, value));
});
```

---

## 규칙

### DO
- 설정: electron-store / 구조화: SQLite / 민감: 암호화
- IPC로만 렌더러 노출, 타입·에러·검증
- 스키마 마이그레이션, 백업 제공

### DON'T
- 렌더러 localStorage에 앱 핵심 데이터 저장 (UI persist만 Zustand)
- 평문 시크릿, 마이그레이션·검증 생략
