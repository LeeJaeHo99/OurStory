# CI/CD (GitHub Actions)

CI/CD는 **GitHub Actions**만 사용합니다.  
테스트는 [`devops-testing.md`](./devops-testing.md),  
로컬/이미지 인프라는 [`devops-docker.md`](./devops-docker.md) (`postgres:15`, `redis:7-alpine`).

워크플로는 저장소 루트 `.github/workflows/`에 둡니다.

---

## 파이프라인 개요

```
PR / push (main)
  → lint + type-check + test (+ build)
  → 통과 시에만 머지 (브랜치 보호)

tag v* / main (배포 승인 시)
  → build image / artifact
  → deploy (환경별 Secrets)
```

| 워크플로 | 트리거 | 역할 |
|----------|--------|------|
| `ci.yml` | `pull_request`, `push` (main) | 품질 게이트 |
| `cd.yml` (선택) | `push` tags `v*`, 또는 `workflow_dispatch` | 배포 |

---

## CI (`ci.yml`)

모노레포면 `defaults` / `working-directory` 또는 path filter로 패키지를 나눕니다.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5

    env:
      NODE_ENV: test
      DB_HOST: localhost
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: postgres
      REDIS_HOST: localhost
      REDIS_PORT: 6379
      JWT_SECRET: ci-only-secret
      API_PORT: 3001

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
          # 모노레포: cache-dependency-path: backend/package-lock.json

      - name: Install
        run: npm ci
        # working-directory: backend

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run type-check
        # 또는: npx tsc --noEmit

      - name: Test
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        if: always()
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

프론트만 돌릴 때는 `services`(postgres/redis)를 빼고 job을 분리해도 됩니다.

```yaml
jobs:
  backend:
    # … services + backend working-directory
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci
        working-directory: frontend  # 또는 web
      - run: npm run lint && npm run test && npm run build
        working-directory: frontend
```

---

## CD (`cd.yml`) — 예시

실제 호스트(AWS/GCP/Vercel/Railway 등)에 맞게 `deploy` 스텝만 교체합니다.

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # GitHub Environment + 보호 규칙 권장
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci
      - run: npm run build

      # 예: GHCR 이미지 푸시
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ github.repository }}/api:${{ github.ref_name }}

      # 예: 이후 SSH / kubectl / 클라우드 CLI deploy
      # - run: ./scripts/deploy.sh
      #   env:
      #     DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

Electron 릴리스는 [`electron-build-deployment.md`](../frontend/desktop/electron-build-deployment.md)의 tag `v*` 워크플로를 따릅니다.

---

## Secrets · 환경

| 저장 위치 | 용도 |
|-----------|------|
| Repository / Environment **Secrets** | `JWT_SECRET`, DB 비밀번호, 배포 키, 클라우드 토큰 |
| Variables (비민감) | 공개 API URL, 플래그 |

### DO
- 프로덕션 값은 GitHub Secrets / Environment만 사용
- `environment: production` + required reviewers (가능하면)
- CI용 `JWT_SECRET` 등은 프로덕션과 분리

### DON'T
- 워크플로·로그에 시크릿 출력
- `.env` / `.env.local`을 아티팩트로 업로드
- `pull_request`에서 프로덕션 Secrets를 쓰는 위험한 deploy

PR은 **fork PR**에서 시크릿이 제한될 수 있음 — 배포 job은 `push`/tag/`workflow_dispatch`로만.

---

## 브랜치 보호 (권장)

`main` (및 `develop`):

- Require pull request before merging  
- Require status checks: **CI / quality** (및 frontend/backend job)  
- Require branches to be up to date (선택)

---

## 규칙

### DO
- GitHub Actions만 사용, Node **22** (Dockerfile과 맞춤)
- CI 서비스 이미지: **`postgres:15`**, **`redis:7-alpine`**
- `npm ci`, lint → typecheck → test → build 순서
- lint/format 규칙은 [`eslint-prettier.md`](../shared/eslint-prettier.md)
- `concurrency`로 동일 ref 중복 런 취소
- E2E job은 [`devops-e2e.md`](./devops-e2e.md)

### DON'T
- `npm install`을 CI 기본으로 (lockfile 무시 위험)
- 검증 없이 main 직접 push 배포
- 액션 major 핀 없이 `@master` 남용 (주요 액션은 `@v4` 등 고정)

---

## 요약

1. `.github/workflows/ci.yml` — PR/main 품질 게이트  
2. CI DB/Redis = Docker와 동일 이미지 태그  
3. Secrets는 GitHub Environment, CD는 tag 또는 수동  
4. 테스트 상세는 `devops-testing.md`
