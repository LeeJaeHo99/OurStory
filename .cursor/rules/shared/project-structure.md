# Project Structure

모든 프로젝트는 **모노레포 방식**으로 운영합니다.

---

## 기본 구조

```
project-root/
├── backend/              # NestJS 서버
├── frontend/             # 클라이언트 (형식은 프로젝트마다 다름)
├── package.json          # 루트 monorepo 설정
├── .gitignore
└── README.md
```

---

## Backend 폴더

**항상 NestJS**로 구성됩니다.

```
backend/
├── src/                  # 소스 코드
├── test/                 # 테스트 파일
├── package.json
├── tsconfig.json
└── README.md
```

환경변수(`.env`, `.env.local`)는 gitignore 대상이라 구조에 포함하지 않습니다.  
규칙은 [`environment-variables.md`](./environment-variables.md)를 참고하세요.

---

## Frontend 폴더

### 경우 1: 단일 클라이언트 (Next.js / React Native / Electron 중 하나만)

```
frontend/
├── src/                  # 소스 코드
├── public/               # 정적 파일
├── package.json
├── tsconfig.json
└── README.md
```

상세 구조는 프로젝트의 스택에 따라:
- **Next.js**: [`frontend/web/nextjs.md`](../frontend/web/nextjs.md)
- **React Native**: [`frontend/mobile/react-native.md`](../frontend/mobile/react-native.md)
- **Electron**: [`frontend/desktop/electron.md`](../frontend/desktop/electron.md)

---

### 경우 2: 다중 클라이언트 (Next.js + React Native 또는 Next.js + Electron 등)

```
frontend/
├── web/                  # Next.js 프로젝트
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── mobile/               # React Native 프로젝트
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── desktop/              # Electron 프로젝트
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── shared/               # 공유 코드 (선택사항)
│   ├── types/
│   ├── utils/
│   └── constants/
│
└── README.md
```

각 클라이언트의 상세 구조는 해당 규칙 문서를 참고:
- **Next.js**: [`frontend/web/nextjs.md`](../frontend/web/nextjs.md)
- **React Native**: [`frontend/mobile/react-native.md`](../frontend/mobile/react-native.md)
- **Electron**: [`frontend/desktop/electron.md`](../frontend/desktop/electron.md)

---

## 루트 package.json 설정

```json
{
  "name": "project-name",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "frontend/web",
    "frontend/mobile",
    "frontend/desktop"
  ],
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:web": "cd frontend/web && npm run dev",
    "dev:mobile": "cd frontend/mobile && npm start",
    "dev:desktop": "cd frontend/desktop && npm run dev",
    "build:backend": "cd backend && npm run build",
    "build:web": "cd frontend/web && npm run build",
    "build:mobile": "cd frontend/mobile && npm run build",
    "build:desktop": "cd frontend/desktop && npm run build"
  }
}
```

---

## 프로젝트 타입별 예시

### 예 1: NestJS + Next.js + React Native

```
root/
├── backend/              # NestJS API
├── frontend/
│   ├── web/              # Next.js 웹
│   ├── mobile/           # React Native
│   └── shared/           # 공유 types, utils
├── package.json
└── README.md
```

### 예 2: NestJS + Next.js

```
root/
├── backend/              # NestJS API
├── frontend/             # Next.js (폴더 내부에 직접 구성)
│   ├── src/
│   ├── public/
│   └── package.json
├── package.json
└── README.md
```

### 예 3: NestJS + Next.js + React Native + Electron

```
new-app/
├── backend/              # NestJS API
├── frontend/
│   ├── web/              # Next.js
│   ├── mobile/           # React Native
│   ├── desktop/          # Electron
│   ├── shared/           # 공유 코드
│   └── README.md
├── package.json
└── README.md
```

---

## 핵심 규칙

### DO ✅
- 루트는 **항상** backend, frontend, package.json, README.md, .gitignore 5개
- frontend 안에 여러 클라이언트가 있으면 **web, mobile, desktop 으로만 명명**
- 공유 코드는 shared 폴더에 type, utils, constants만
- 각 폴더의 package.json과 tsconfig.json은 **독립적으로 관리**
- 루트 workspaces에 모든 워크스페이스 명시

### DON'T ❌
- frontend 폴더를 다른 이름으로 변경 (frontend는 고정)
- web, mobile, desktop 이외의 이름 사용
- backend가 두 개 이상 존재
- 클라이언트 코드가 backend 폴더 안에 들어가기
- 루트 src, components 같은 폴더 추가
- `.env` / `.env.local`을 저장소에 커밋

---

## Monorepo 패키지 관리

```bash
# npm workspaces 사용 (권장)
npm install

# 특정 워크스페이스에서만 패키지 설치
npm install express -w backend

# 모든 워크스페이스에서 테스트
npm run test --workspaces
```

---

## AI 프롬프트 팁

프로젝트 구조를 AI에 설명할 때:
```
"다음 모노레포 구조로 프로젝트를 구성해줘:
- backend: NestJS
- frontend: [web | mobile | desktop | 복합]

프로젝트 구조 규칙: [이 문서의 해당 섹션]"
```