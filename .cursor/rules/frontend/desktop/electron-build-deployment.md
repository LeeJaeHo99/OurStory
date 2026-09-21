# Electron Build & Deployment

electron-builder 빌드·서명·자동 업데이트·배포입니다.  
스크립트 기본값은 [`electron-project-structure.md`](./electron-project-structure.md)와 맞춥니다.

```bash
npm install -D electron-builder
npm install electron-updater
```

---

## electron-builder.yml

```yaml
appId: com.example.myapp
productName: My Electron App
directories:
  buildResources: electron/icon
  output: dist
files:
  - dist/**/*
  - dist-electron/**/*
  - node_modules/**/*
  - package.json

mac:
  target: [dmg, zip]
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: electron/entitlements.mac.plist
  entitlementsInherit: electron/entitlements.mac.plist
dmg:
  window: { x: 120, y: 120, width: 540, height: 380 }

win:
  target: [nsis, portable]
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true

linux:
  target: [AppImage, deb]
  category: Productivity
appImage:
  artifactName: '${name}-${version}.${ext}'

publish:
  provider: github
  owner: your-org
  repo: your-repo
# 또는 generic: url: https://your-server.com/releases/
```

---

## Scripts · 버전

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:electron": "tsc src/main/main.ts --outDir dist-electron --module commonjs",
    "dist": "npm run build && npm run build:electron && electron-builder",
    "dist:win": "… && electron-builder --win",
    "dist:mac": "… && electron-builder --mac",
    "dist:linux": "… && electron-builder --linux",
    "dist:all": "… && electron-builder -mwl",
    "release": "npm run dist && electron-builder --publish always",
    "type-check": "tsc --noEmit"
  }
}
```

```bash
npm version patch|minor|major
```

```typescript
// vite define
__APP_VERSION__: JSON.stringify(require('./package.json').version)
```

---

## 코드 서명

```bash
# macOS
security find-identity -v -p codesigning
export CSC_IDENTITY_AUTO_DISCOVERY=false  # 개발 시 비활성 가능
npm run build:electron && electron-builder --mac --publish never

# Windows
set CSC_KEY_PASSWORD=your_password
npm run dist:win

# 서명 오류(개발): CSC_IDENTITY_AUTO_DISCOVERY=false
```

```yaml
# macOS 노타리제이션 (Big Sur+)
mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  notarize:
    teamId: "YOUR_TEAM_ID"
```

---

## 자동 업데이트

```typescript
// main/updater.ts
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.on('update-available', () => {});
autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());
autoUpdater.on('error', (error) => console.error(error));

// createWindow 후 setupAutoUpdater()
```

`publish`는 GitHub 또는 generic URL.

---

## 환경 · 최적화

```typescript
export const isDev = process.env.NODE_ENV === 'development';
export const API_URL = isDev ? 'http://localhost:3001' : 'https://api.example.com';

// BrowserWindow: webPreferences.devTools: isDev, openDevTools는 개발만
```

```typescript
// vite manualChunks: react / vendor(zustand, router)
// 아이콘: 512 / 256 / 128 / .icns — electron/icon
// asar: true (압축)
```

---

## CI · 체크리스트 · 흐름

```yaml
# .github/workflows/release.yml — tag v* 시
# matrix: ubuntu / windows / macos
# npm install → build → build:electron → dist
# softprops/action-gh-release → dist/**/*
```

```
[ ] version / CHANGELOG / git tag (v1.0.0)
[ ] 프로덕션 env, 콘솔·소스맵 정리
[ ] 테스트 → 빌드 → 코드 서명
[ ] GitHub Release → 공지 → 자동 업데이트 확인
```

```
개발 → 로컬 테스트 → 버전 업 → npm run dist
  → 서명 → Release → 공지 → OTA(electron-updater)
```

---

## 모니터링

```typescript
Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: isDev ? 'development' : 'production',
});
```

---

## 규칙

### DO
- electron-builder, 플랫폼별 타깃, 서명·버전 체계
- electron-updater, env 분리, 배포 전 체크리스트

### DON'T
- 개발 빌드·미서명 배포, 프로덕션 console.log
- 테스트 없이 릴리스, 버전·번들 방치
