# Code Convention Guide

코딩 규칙 및 패턴 가이드입니다.

**NestJS · Next.js · React Native · Electron** 스택을 사용하는 모든 프로젝트에 적용됩니다.

## Cursor Project Rules (자동 적용)

루트 `.cursor/rules/*.mdc`가 AI에 주입됩니다.

| 파일 | 적용 |
|------|------|
| `00-core.mdc` | **항상** (`alwaysApply`) |
| `backend-nestjs.mdc` | `backend/**` 등 |
| `frontend-nextjs.mdc` | `frontend/**`, `src/app/**` 등 |
| `frontend-react-native.mdc` | `mobile/**`, `*.screen.tsx` 등 |
| `frontend-electron.mdc` | `electron/**`, `src/main|renderer/**` |
| `devops.mdc` | Docker, `.github/workflows`, Playwright |

상세 가이드는 같은 폴더의 `shared/` · `backend/` · `frontend/` · `devops/` **`.md`** 를 따른다.  
앱만 따로 열 경우 해당 앱 루트에 `.cursor`를 두거나, 이 `project` 루트를 워크스페이스로 연다.

---

## 📋 목차

- [개요](#개요)
- [폴더 구조](#폴더-구조)
- [사용 방법](#사용-방법)
- [섹션 소개](#섹션-소개)
- [AI 프롬프트 사용](#ai-프롬프트-사용)
- [기여](#기여)

---

## 개요

이 저장소는 **AI 기반 코드 생성을 위한 상세한 규칙 문서**입니다.

### 목표
- AI가 생성한 코드를 일관되게 유지
- 개발자가 규칙을 쉽게 이해하고 적용
- 프로젝트 간 코드 스타일 통일
- 생산성 향상

### 특징
- ✅ DO/DON'T 규칙로 명확한 가이드
- 💡 실전 예제 코드 포함
- 🎯 AI 프롬프트 팁 제공 (각 파일 끝)
- 📦 스택별 최적화된 설정

### 📊 현황
- Shared (공통) — ESLint/Prettier 포함
- Backend (NestJS) — Postgres 15, Redis 7, Swagger, Security, Health
- Frontend/Web · Mobile · Desktop
- DevOps — Testing, Docker, CI/CD, E2E

---

## 폴더 구조

```
rules/
├── README.md                            # 전체 가이드
├── shared/                              # 모든 스택 공통
│   ├── project-structure.md
│   ├── api-response-format.md
│   ├── environment-variables.md
│   ├── error-handling.md
│   ├── naming-conventions.md
│   ├── typescript.md
│   └── eslint-prettier.md               # ESLint + Prettier
│
├── backend/                             # NestJS 백엔드
│   ├── nestjs-project-structure.md
│   ├── nestjs-controller.md
│   ├── nestjs-service.md
│   ├── nestjs-database.md
│   ├── nestjs-validation.md
│   ├── nestjs-middleware-guards-interceptors.md
│   ├── nestjs-module-di.md
│   ├── nestjs-jwt-auth.md
│   ├── nestjs-custom-decorators.md
│   ├── nestjs-config-management.md
│   ├── nestjs-exception-filters.md
│   ├── nestjs-typeorm-advanced.md
│   ├── nestjs-class-transformer.md
│   ├── nestjs-redis.md
│   ├── nestjs-caching.md
│   ├── nestjs-swagger.md                # OpenAPI
│   ├── nestjs-file-upload.md            # multipart / S3
│   ├── nestjs-security.md               # Helmet · Throttler · CORS
│   └── nestjs-health.md                 # /health · /ready
│
├── frontend/web/                        # Next.js
│   ├── nextjs-project-structure.md
│   ├── nextjs-routing.md
│   ├── nextjs-components.md
│   ├── nextjs-state-management.md
│   ├── nextjs-data-fetching.md
│   ├── nextjs-forms.md
│   ├── nextjs-performance.md
│   ├── nextjs-zustand-advanced.md
│   ├── nextjs-tanstack-query.md
│   ├── nextjs-caching.md
│   ├── nextjs-shadcn-ui.md
│   └── nextjs-lucide-icons.md
│
├── frontend/mobile/                     # React Native
│   ├── rn-project-structure.md
│   ├── rn-navigation.md
│   ├── rn-components.md
│   ├── rn-state-management.md
│   ├── rn-data-fetching.md
│   ├── rn-styling.md
│   ├── rn-native-modules.md
│   └── rn-performance-deployment.md
│
├── frontend/desktop/                    # Electron
│   ├── electron-project-structure.md
│   ├── electron-ipc-communication.md
│   ├── electron-react-components.md
│   ├── electron-state-management.md
│   ├── electron-native-features.md
│   ├── electron-data-storage.md
│   ├── electron-build-deployment.md
│   └── electron-styling.md
│
├── devops/
│   ├── devops-testing.md
│   ├── devops-docker.md
│   ├── devops-cicd.md
│   └── devops-e2e.md                    # Playwright / Maestro 등
│
└── README.md
```

---

## 사용 방법

### 1️⃣ 신규 프로젝트 시작

프로젝트를 만들 때 해당 스택의 구조 파일을 먼저 읽으세요.

```bash
# NestJS 백엔드 시작
→ backend/nestjs-project-structure.md 읽기

# Next.js 프론트엔드 시작
→ frontend/web/nextjs-project-structure.md 읽기

# React Native 모바일 시작
→ frontend/mobile/rn-project-structure.md 읽기

# Electron 데스크톱 시작
→ frontend/desktop/electron-project-structure.md 읽기
```

### 2️⃣ 특정 기능 구현

기능별로 해당 가이드를 찾아서 참고하세요.

```
상황: API 데이터를 페칭해야 함
→ frontend/web/nextjs-data-fetching.md

상황: 상태 관리를 구현해야 함
→ frontend/web/nextjs-state-management.md

상황: 폼 검증을 해야 함
→ backend/nestjs-validation.md
```

### 3️⃣ 공통 규칙 확인

모든 스택에 공통으로 적용되는 규칙을 확인하세요.

```
shared/naming-conventions.md     # 변수/함수 이름
shared/error-handling.md         # 에러 처리
shared/typescript.md             # TypeScript 규칙
api-response-format.md           # API 응답 형식 통일
git-workflow.md                  # Git 커밋/PR 규칙
```

---

## 섹션 소개

### 🔧 Shared (공통)
모든 프로젝트가 따라야 할 기본 규칙입니다.
- 폴더 구조, API 응답, 환경 변수, 에러 처리
- 네이밍, TypeScript
- ESLint + Prettier

### 🖥️ Backend (NestJS)
Node.js 백엔드 개발 규칙입니다.
- 프로젝트 구조 · 컨트롤러 · 서비스 · DTO
- PostgreSQL 15 · Redis 7 · 서버 캐싱
- JWT · 미들웨어/가드 · 설정 · 예외 필터
- Swagger · 파일 업로드 · Helmet/Throttler/CORS
- Health (`/health`, `/ready`)

### 🌐 Frontend (Next.js)
React 웹 프론트엔드 개발 규칙입니다.
- App Router 구조
- 라우팅
- 컴포넌트 작성
- 상태 관리 (Zustand)
- 데이터 페칭
- 폼 처리
- 스타일링 (Tailwind)
- 성능 최적화
- **Zustand 고급** (Immer, Persist, DevTools)
- **TanStack Query** (캐싱, mutation, 무한 스크롤)
- **React Hook Form** (동적 필드, Multi-step)
- **Zod 스키마** (검증, Transform)
- **shadcn/ui 컴포넌트** (Form, Dialog, Card)
- **Lucide React 아이콘** (Navigation, Status)

### 📱 Mobile (React Native)
네이티브 모바일 개발 규칙입니다.
- Expo 프로젝트 구조
- React Navigation
- 네이티브 컴포넌트
- 상태 관리
- 데이터 페칭
- StyleSheet/Tailwind
- 네이티브 기능 (카메라, 위치 등)
- 성능 & 배포

### 🖨️ Desktop (Electron)
Electron 데스크톱 애플리케이션 개발 규칙입니다.
- Vite + React 구조
- IPC 통신
- React 컴포넌트
- 상태 관리 (메인/렌더러 분리)
- 네이티브 기능
- 데이터 저장 (SQLite, electron-store)
- 빌드 & 배포 (Electron Builder)

### 🔨 DevOps
테스트, Docker, CI/CD, E2E 규칙입니다.
- Jest 설정 (Nest / Next / RN / Electron)
- Docker Compose: **필수** `postgres:15`, `redis:7-alpine`
- Dockerfile (`node:22-alpine`)
- **GitHub Actions** CI/CD (`ci.yml` / `cd.yml`)
- E2E: Playwright (web), Maestro/Detox (mobile)

---

## AI 프롬프트 사용

### 기본 방식

각 파일의 **끝에 AI 프롬프트 팁**이 있습니다. 이를 활용하세요.

```
[파일 끝의 예제]

## AI 프롬프트 팁

컴포넌트 작성할 때:
```
"다음 규칙으로 React 컴포넌트를 만들어줘:

1. Props는 interface로 타입 정의
2. Tailwind로 스타일링
3. 파일명: [name].component.tsx
4. 반환 타입 명시"
```
```

### 실제 사용 예시

```
사용자 프롬프트:
"다음 규칙을 따라서 사용자 생성 폼을 만들어줘:

[shared/naming-conventions.md의 내용]
[frontend/nextjs-forms.md의 내용]"

→ AI가 규칙에 맞춘 코드 생성
```

### 장점
- ✅ 일관된 코드 스타일 유지
- ✅ AI가 규칙을 정확히 이해
- ✅ 코드 리뷰 시간 단축
- ✅ 프로젝트 온보딩 가속화

---

## 파일별 주요 내용

### shared
| 파일 | 설명 |
|------|------|
| project-structure | 폴더 구조 통일 |
| api-response-format | API 응답 형식 |
| environment-variables | .env 관리 |
| error-handling | 예외 처리 |
| naming-conventions | 변수/함수 이름 규칙 |
| typescript | TypeScript 기초 |
| eslint-prettier | ESLint + Prettier 공통 |

### backend
| 파일 | 설명 |
|------|------|
| nestjs-project-structure | 프로젝트 폴더 구조 |
| nestjs-controller | HTTP 라우팅 |
| nestjs-service | 비즈니스 로직 |
| nestjs-database | TypeORM / Postgres 15 |
| nestjs-validation | DTO / class-validator |
| nestjs-middleware-guards | 미들웨어 · 가드 · 인터셉터 |
| nestjs-module-di | 모듈 · DI |
| nestjs-jwt-auth | JWT 인증 |
| nestjs-custom-decorators | @CurrentUser, @Roles 등 |
| nestjs-config-management | 환경 변수 · ConfigService |
| nestjs-exception-filters | 글로벌 에러 처리 |
| nestjs-typeorm-advanced | QueryBuilder · 트랜잭션 |
| nestjs-class-transformer | Expose/Exclude |
| nestjs-redis | Redis 7 인프라 |
| nestjs-caching | 서버 캐시 전략 |
| nestjs-swagger | OpenAPI / `@Api*` |
| nestjs-file-upload | multipart · local/S3 |
| nestjs-security | Helmet · Throttler · CORS |
| nestjs-health | `/health` · `/ready` |

### frontend (web)
| 파일 | 설명 |
|------|------|
| nextjs-project-structure | App Router 구조 |
| nextjs-routing | 라우팅 패턴 |
| nextjs-components | React 컴포넌트 |
| nextjs-state-management | Zustand |
| nextjs-data-fetching | 서비스 + TanStack Query |
| nextjs-forms | Zod + RHF |
| nextjs-performance | 성능 최적화 |
| nextjs-zustand-advanced | Immer, Persist, DevTools |
| nextjs-tanstack-query | Query/Mutation 고급 |
| nextjs-caching | 클라이언트 캐시 전략 |
| nextjs-shadcn-ui | shadcn/ui |
| nextjs-lucide-icons | Lucide 아이콘 |

### mobile
| 파일 | 설명 |
|------|------|
| rn-project-structure | Expo 구조 |
| rn-navigation | React Navigation |
| rn-components | 네이티브 컴포넌트 |
| rn-state-management | Zustand + AsyncStorage |
| rn-data-fetching | TanStack Query |
| rn-styling | NativeWind |
| rn-native-modules | 카메라, 위치 등 |
| rn-performance-deployment | 성능 · EAS |

### desktop
| 파일 | 설명 |
|------|------|
| electron-project-structure | Vite + React |
| electron-ipc-communication | IPC |
| electron-react-components | UI 컴포넌트 |
| electron-state-management | Zustand |
| electron-native-features | 파일, 메뉴 등 |
| electron-data-storage | electron-store, SQLite |
| electron-build-deployment | 빌드 · 배포 |
| electron-styling | Tailwind |

### devops
| 파일 | 설명 |
|------|------|
| devops-testing | Jest, RTL |
| devops-docker | Compose + Dockerfile |
| devops-cicd | GitHub Actions |
| devops-e2e | Playwright / Maestro 등 |

---

## 빠른 시작

### 1단계: 스택 선택 후 구조 확인

```bash
# NestJS 프로젝트
→ backend/nestjs-project-structure.md

# Next.js 프로젝트
→ frontend/nextjs-project-structure.md

# React Native 프로젝트
→ mobile/rn-project-structure.md

# Electron 프로젝트
→ desktop/electron-project-structure.md
```

### 2단계: 공통 규칙 확인

```bash
→ shared/ 폴더의 모든 파일 읽기
  (naming-conventions, typescript, error-handling 필수)
```

### 3단계: 기능별 가이드 참고

```bash
기능 구현 시 해당 파일 검색
예: "폼 만들어야 함" → nextjs-forms.md
```

### 4단계: AI 프롬프트 팁 사용

```bash
각 파일 끝의 "AI 프롬프트 팁" 복사
→ ChatGPT/Claude에 붙여넣기
→ 규칙을 따른 코드 생성
```

---

## 규칙 업데이트

### 새로운 패턴 추가

새로운 패턴이나 모범 사례를 발견하면 해당 파일에 추가합니다.

1. 파일 수정
2. CHANGELOG.md 업데이트
3. 팀에 공지

### 버전 관리

각 파일은 **마크다운**이므로 Git으로 버전 관리됩니다.

```bash
git log --oneline shared/naming-conventions.md
→ 변경 이력 확인 가능
```