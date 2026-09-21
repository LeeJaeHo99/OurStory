# ESLint & Prettier (Shared)

모든 스택(Nest · Next · RN · Electron)에서 **ESLint + Prettier**를 사용합니다.  
CI에서 `lint`를 필수로 돌립니다 — [`devops-cicd.md`](../devops/devops-cicd.md).

```bash
# 공통 (패키지 루트 또는 앱별)
npm install -D eslint prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-config-prettier eslint-plugin-prettier
```

스택별 추가:

```bash
# Nest
npm install -D @nestjs/eslint-plugin  # 선택

# Next
npx eslint --print-config .  # 또는 eslint-config-next
npm install -D eslint-config-next

# RN / Expo
# eslint-config-expo 등 템플릿 권장

# Electron 렌더러 = React → next/react 플러그인 패턴
npm install -D eslint-plugin-react eslint-plugin-react-hooks
```

---

## 스크립트 (통일)

```json
{
  "scripts": {
    "lint": "eslint \"{src,test,app}/**/*.{ts,tsx}\" --max-warnings 0",
    "lint:fix": "npm run lint -- --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,json,md,css}\"",
    "type-check": "tsc --noEmit"
  }
}
```

CI 순서: `lint` → `type-check` → `test` → `build`.

---

## Prettier (공통)

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 4,
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

```ignore
# .prettierignore
dist
coverage
node_modules
.next
out
build
postgres
redis
*.lock
```

---

## ESLint (TypeScript 공통 요지)

```javascript
// .eslintrc.cjs (백엔드 예시)
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': 'error',
  },
};
```

```javascript
// Next.js — extends에 추가
extends: [
  'next/core-web-vitals',
  'plugin:@typescript-eslint/recommended',
  'plugin:prettier/recommended',
],
```

모노레포면 루트에 공유 config를 두고 패키지에서 `extends` 합니다.

---

## 규칙

### DO
- ESLint + Prettier 충돌 방지 (`eslint-config-prettier`)
- `--max-warnings 0` (CI)
- `singleQuote`, `trailingComma: all` 등 팀 포맷 고정
- import/파일명은 [`naming-conventions.md`](./naming-conventions.md), TS는 [`typescript.md`](./typescript.md)

### DON'T
- 포맷만 Prettier·규칙은 ESLint로 혼선 없이 유지하되 **포맷 규칙을 ESLint에 중복 정의**하지 않기
- `any` 남발 방치 (`warn` 이상)
- lint 실패를 CI에서 무시
