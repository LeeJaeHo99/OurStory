# Docker (Backend)

로컬·배포용 Docker 구성입니다.  
인프라는 필수로 **`postgres:15`**, **`redis:7-alpine`** 을 사용합니다.

Nest 연동은 [`nestjs-database.md`](../backend/nestjs-database.md), [`nestjs-redis.md`](../backend/nestjs-redis.md),  
환경변수는 [`environment-variables.md`](../shared/environment-variables.md),  
CI에서 동일 이미지를 띄우는 방법은 [`devops-cicd.md`](./devops-cicd.md)를 따릅니다.

---

## 필수 이미지

| 서비스 | 이미지 (고정) | 기본 포트 |
|--------|---------------|-----------|
| PostgreSQL | `postgres:15` | 5432 |
| Redis | `redis:7-alpine` | 6379 |
| App (Nest) | `node:22-alpine` 기반 Dockerfile | 3001 |

다른 major 태그(`postgres:16`, `redis:6` 등)로 바꾸지 않습니다.

---

## docker-compose.yaml

백엔드 루트에 둡니다. (예: `backend/docker-compose.yaml`)

```yaml
services:
  postgres:
    image: postgres:15
    restart: always
    volumes:
      - ./postgres:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - ./redis:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    build: .
    command: npm run start:dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - '3001:3001'
    env_file:
      - .env
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:3001/ready']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
```

앱 `/health`·`/ready` 규칙은 [`nestjs-health.md`](../backend/nestjs-health.md).

### 호스트 vs 컨테이너

| 실행 위치 | `DB_HOST` / `REDIS_HOST` |
|-----------|--------------------------|
| 앱만 로컬 (`npm run start:dev`), DB·Redis만 Docker | `localhost` |
| compose의 `app` 서비스 안 | `postgres` / `redis` (서비스명) |

`.env` / `.env.local` 예시는 shared env 문서를 따릅니다.

---

## Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

개발용 compose는 보통 `command: npm run start:dev` + 소스 마운트로 Dockerfile `CMD`를 덮어씁니다.  
프로덕션 이미지는 `start:prod`를 유지합니다.

`.dockerignore` 권장:

```
node_modules
dist
postgres
redis
.git
.env.local
*.md
coverage
```

---

## 자주 쓰는 명령

```bash
# DB + Redis만 (앱은 호스트에서)
docker compose up -d postgres redis

# 전체
docker compose up -d --build

docker compose logs -f app
docker compose down
docker compose down -v   # 볼륨 삭제 시 주의
```

```json
// package.json scripts (선택)
{
  "docker:up": "docker compose up -d",
  "docker:db": "docker compose up -d postgres redis",
  "docker:down": "docker compose down",
  "docker:logs": "docker compose logs -f"
}
```

볼륨 `./postgres`, `./redis`는 gitignore 합니다.

---

## 규칙

### DO
- **항상** `postgres:15`, `redis:7-alpine`
- `depends_on` + healthcheck로 앱 기동 순서 보장
- 시크릿은 `env_file` / Secrets, 이미지에 하드코딩 금지
- compose 서비스명과 `DB_HOST` / `REDIS_HOST` 일치

### DON'T
- 임의 DB/Redis 이미지 태그 변경
- 프로덕션 비밀번호를 compose에 평문 고정(배포는 Secrets)
- `node_modules`를 호스트에 잘못 덮어쓰기 (anonymous volume 유지)

---

## 요약

1. `postgres:15` + `redis:7-alpine` 필수  
2. 로컬은 `docker compose up` → Nest는 env의 host로 접속  
3. 앱 컨테이너에서는 host = 서비스명 (`postgres`, `redis`)  
4. Dockerfile = `node:22-alpine` + `start:prod`
