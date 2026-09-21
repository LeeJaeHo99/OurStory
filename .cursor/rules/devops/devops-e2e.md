# E2E Testing

유닛/통합은 Jest — [`devops-testing.md`](./devops-testing.md).  
E2E는 **실제 사용자 흐름**만 최소한으로 둡니다 (피라미드 ~10%).

| 대상 | 도구 |
|------|------|
| Web (Next.js) | **Playwright** |
| Mobile (RN/Expo) | **Maestro** 또는 Detox (네이티브 빌드 필요 시) |
| API (선택) | Playwright `request` / Jest e2e (Nest) |
| Electron | Playwright `_electron` 또는 렌더러+IPC 통합 테스트 |

```bash
# Web
npm install -D @playwright/test
npx playwright install

# Nest API e2e (기존)
# jest --config ./test/jest-e2e.json

# Mobile (선택)
# Maestro: https://maestro.mobile.dev
```

---

## Web — Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('auth', () => {
  test('login → home', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
```

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 선택자
- `getByRole` / `getByLabel` / `getByTestId` 우선
- CSS 클래스·포지션 의존 금지

---

## API E2E (Nest)

```typescript
// test/app.e2e-spec.ts
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    // ValidationPipe 등 main과 동일하게
    await app.init();
  });

  it('/ready (GET)', () =>
    request(app.getHttpServer()).get('/ready').expect(200));

  afterAll(() => app.close());
});
```

CI에서는 [`nestjs-health.md`](../backend/nestjs-health.md)의 `/ready`가 뜰 때까지 Postgres/Redis 서비스를 띄웁니다 ([`devops-cicd.md`](./devops-cicd.md)).

---

## Mobile E2E

- **Maestro**: YAML 플로우, Expo Go/dev client에 적합  
- **Detox**: 네이티브 빌드·시뮬레이터 필요, CI 비용 큼  

핵심 플로우만: 온보딩 → 로그인 → 주요 1개 기능.

```yaml
# .maestro/login.yaml (개념)
appId: com.example.app
---
- launchApp
- tapOn: "Email"
- inputText: "user@example.com"
- tapOn: "Login"
- assertVisible: "Home"
```

---

## Electron E2E

```typescript
// Playwright electron (개념)
const { _electron } = require('playwright');
const electronApp = await _electron.launch({ args: ['.'] });
const window = await electronApp.firstWindow();
await expect(window).toHaveTitle(/My App/);
await electronApp.close();
```

IPC·메인 프로세스 단위는 Jest mock으로 두고, E2E는 스모크만.

---

## CI 연동

```yaml
# ci.yml job 예시
e2e-web:
  needs: quality
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '22', cache: npm }
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npm run test:e2e
      env:
        E2E_BASE_URL: http://localhost:3000
```

PR마다 전체 모바일 E2E를 돌리지 말고, nightly / main에만 돌리는 것도 가능합니다.

---

## 규칙

### DO
- E2E는 스모크·핵심 플로우만 (로그인, 결제/생성 1건 등)
- Playwright + role/label 선택자
- CI에서 flake 대비 `retries`

### DON'T
- 유닛으로 충분한 로직을 E2E로 대체
- 깨지기 쉬운 클래스 선택자
- 시크릿 계정을 코드에 하드코딩 (Secrets / 테스트 시드)
