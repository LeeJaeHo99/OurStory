# Testing with Jest

Jest + Testing Library 테스트 전략입니다.

```bash
# 공통
npm install -D jest @types/jest ts-jest

# 웹/Electron 렌더러
npm install -D @testing-library/react @testing-library/jest-dom

# React Native
npm install -D @testing-library/react-native
```

---

## 공통 설정

```javascript
// jest.config.js (백엔드/Node 기본)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // React: 'jsdom' | RN: preset 'react-native'
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
    './src/critical/': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  // React: setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
};
```

```typescript
// jest.setup.ts (React)
import '@testing-library/jest-dom';
```

```json
// tsconfig — "types": ["jest", "@testing-library/jest-dom"]
// scripts
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
}
```

---

## 백엔드 (NestJS)

```typescript
// user.service.test.ts
describe('UserService', () => {
  let service: UserService;
  beforeEach(() => {
    service = new UserService();
  });

  it('create', () => {
    const user = { id: '1', name: 'John', email: 'john@example.com' };
    expect(service.create(user)).toEqual(user);
    expect(service.findAll()).toHaveLength(1);
  });

  it('findById / not found', () => {
    service.create({ id: '1', name: 'John', email: 'john@example.com' });
    expect(service.findById('1')?.name).toBe('John');
    expect(service.findById('x')).toBeUndefined();
  });

  it('update / delete', () => {
    service.create({ id: '1', name: 'John', email: 'john@example.com' });
    expect(service.update('1', { name: 'Jane' })?.name).toBe('Jane');
    expect(service.delete('1')).toBe(true);
    expect(service.findAll()).toHaveLength(0);
  });
});

// controller — service inject / mock
describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  beforeEach(() => {
    service = new UserService();
    controller = new UserController(service);
  });

  it('getAll / getById / throw if missing', () => {
    const user = { id: '1', name: 'John', email: 'john@example.com' };
    service.create(user);
    expect(controller.getAll()).toEqual([user]);
    expect(controller.getById('1')).toEqual(user);
    expect(() => controller.getById('x')).toThrow();
  });
});
```

---

## 프론트엔드 (Next.js + RTL)

```javascript
// testEnvironment: 'jsdom' + setupFilesAfterEnv
```

```typescript
// 컴포넌트
render(<Button onClick={onClick}>Click</Button>);
expect(screen.getByText('Click')).toBeInTheDocument();
fireEvent.click(screen.getByText('Click'));
expect(onClick).toHaveBeenCalledTimes(1);
expect(screen.getByText('Disabled')).toBeDisabled();
expect(container.firstChild).toHaveClass('bg-red-500');

// Input
fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a@b.com' } });
expect(screen.getByText('This field is required')).toBeInTheDocument();

// Hook
const { result } = renderHook(() => useLocalStorage('key', 'initial'));
act(() => result.current[1]('new value'));
expect(result.current[0]).toBe('new value');

// Fetch mock
global.fetch = jest.fn().mockResolvedValueOnce({
  ok: true,
  json: async () => mockUsers,
});
expect(await userService.getUsers()).toEqual(mockUsers);

// Next router
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
```

---

## React Native

```javascript
// preset: 'react-native', setupFilesAfterEnv
```

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';

render(<Button onPress={onPress}>Press</Button>);
fireEvent.press(screen.getByText('Press'));
expect(onPress).toHaveBeenCalled();
```

---

## Electron

```typescript
// 렌더러 — window.ipcApi mock
Object.defineProperty(window, 'ipcApi', {
  value: { invoke: jest.fn() },
  writable: true,
});
fireEvent.click(screen.getByTitle('Close'));
expect(mockIpc.invoke).toHaveBeenCalledWith('window:close');

// 메인 — fs 등 mock
jest.mock('fs/promises');
(fs.readFile as jest.Mock).mockResolvedValueOnce('file content');
registerFileHandlers();
```

---

## 통합 · 커버리지 · CI

```typescript
// 생성 → 조회 → 수정 플로우를 한 시나리오로
const user = userService.create({ id: '1', name: 'John', email: 'john@example.com' });
expect(userService.update('1', { name: 'Jane' })?.name).toBe('Jane');
```

```bash
npm run test:coverage
```

```yaml
# CI 전체(서비스·배포)는 devops-cicd.md — 아래는 테스트 스텝 예시
# .github/workflows/test.yml 또는 ci.yml 내 Test job
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with: { files: ./coverage/lcov.info }
```

파이프라인·postgres/redis 서비스·CD는 [`devops-cicd.md`](./devops-cicd.md).  
E2E(Playwright 등)는 [`devops-e2e.md`](./devops-e2e.md).

---

## 전략 · 규칙

```
유닛 ~70% (서비스·훅·유틸) → 통합 ~20% (컴포넌트+상태·플로우) → E2E ~10% (Playwright/Cypress)
```

### DO
- AAA (Arrange, Act, Assert), `describe`/`it` 명확한 이름
- 단위부터, Mock/Stub 적절히, 에러·비동기 케이스 포함
- 커버리지 전역 70%+ (크리티컬은 더 높게)

### DON'T
- 구현 세부·타이밍에 의존, 테스트 간 의존
- 무의미한 assertion, 100% 커버리지 강요, 테스트 생략
