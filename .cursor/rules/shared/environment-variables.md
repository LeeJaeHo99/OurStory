# Environment Variables

백엔드(NestJS) 환경변수 규칙입니다.

---

## 파일 구조

| 파일 | 용도 | Git |
|------|------|-----|
| `.env` | 실제 배포(프로덕션) | ❌ 커밋 금지 |
| `.env.local` | 로컬 개발 | ❌ 커밋 금지 |

```
.env.local   # 개발 (우선)
.env         # 배포 / 기본값
```

### 로딩 우선순위

```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.local', '.env'], // 앞쪽이 우선
  isGlobal: true,
  validate,
});
```

- 로컬: `.env.local` → 없으면 `.env`
- 배포: 보통 `.env`만 존재 (또는 플랫폼 Secrets로 주입)

---

## 네이밍

### DO ✅
- **SCREAMING_SNAKE_CASE** (`DATABASE_URL`, `JWT_SECRET`, `API_PORT`)
- 도메인 접두사로 그룹화 (`DB_HOST`, `DB_PORT`, `REDIS_URL`)

### DON'T ❌
- camelCase / 소문자 (`databaseUrl`, `secret`)
- 의미 없는 축약 (`SEC`, `P`)

---

## NestJS 사용 규칙

### DO ✅
- 앱 시작 시 **검증 필수** (`class-validator`)
- 런타임에는 **`ConfigService`만** 사용
- 필수 값은 `getOrThrow()`

```typescript
// src/config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumber, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNotEmpty()
  NODE_ENV: string;

  @IsNotEmpty()
  JWT_SECRET: string;

  @IsNumber()
  API_PORT: number;

  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsNotEmpty()
  DB_USER: string;

  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsNotEmpty()
  DB_NAME: string;

  @IsNotEmpty()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors}`);
  }
  return validated;
}
```

```typescript
// ✅
constructor(private readonly config: ConfigService) {}
const port = this.config.getOrThrow<number>('API_PORT');

// ❌
const port = process.env.API_PORT;
```

### DON'T ❌
- `process.env` 직접 접근
- 검증 없이 앱 기동
- 시크릿을 코드/로그/응답에 출력

---

## 보안 & Git

```gitignore
.env
.env.local
.env.*.local
```

### DO ✅
- 프로덕션 시크릿은 **CI/CD Secrets / 호스팅 Secrets**에만 보관
- `*_SECRET`, `*_PASSWORD`, `*_KEY`는 로그 금지

### DON'T ❌
- `.env` / `.env.local` 커밋
- API 키·비밀번호 하드코딩
- 개발용 시크릿을 프로덕션에 재사용

---

## 예시

### `.env.local` (개발)

Docker DB/Redis만 띄운 경우 host는 `localhost`.  
compose `app` 안에서는 `DB_HOST=postgres`, `REDIS_HOST=redis`.  
([`devops-docker.md`](../devops/devops-docker.md) — `postgres:15`, `redis:7-alpine`)

```
NODE_ENV=development
API_PORT=3001
API_URL=http://localhost:3001
JWT_SECRET=dev_only_secret
LOG_LEVEL=debug

# PostgreSQL 15
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
# 또는 DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Redis 7
REDIS_HOST=localhost
REDIS_PORT=6379
# 또는 REDIS_URL=redis://localhost:6379
```

### `.env` (배포)

```
NODE_ENV=production
API_PORT=3000
API_URL=https://api.example.com
JWT_SECRET=<from-secrets-manager>
LOG_LEVEL=error

DB_HOST=postgres
DB_PORT=5432
DB_USER=<secret>
DB_PASSWORD=<secret>
DB_NAME=app

REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 핵심 요약

1. 개발 = `.env.local`, 배포 = `.env`
2. `envFilePath: ['.env.local', '.env']` + `validate`
3. `ConfigService` / `getOrThrow`만 사용
4. 시크릿 파일은 gitignore, 실제 값은 CI/CD Secrets
