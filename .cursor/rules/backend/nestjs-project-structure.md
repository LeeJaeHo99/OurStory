# NestJS Project Structure

NestJS 프로젝트 초기 설정 및 폴더 구조입니다.

---

## 프로젝트 초기화

```bash
npm i -g @nestjs/cli
nest new project-name   # 또는 모노레포: nest new backend
```

---

## 기본 폴더 구조

```
src/
├── app.module.ts           # 루트 모듈
├── app.controller.ts       # 루트 컨트롤러 (선택사항)
├── main.ts                 # 애플리케이션 진입점
│
├── modules/                   # 기능별 모듈
│   ├── users/
│   │   ├── user.module.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── dto/
│   │   │   ├── CreateUser.dto.ts
│   │   │   └── UpdateUser.dto.ts
│   │   ├── types/
│   │   │   ├── user.dto.ts
│   │   │   ├── user.types.ts
│   │   │   └── user.enum.ts
│   │   ├── inqueries/
│   │   │   ├── userList.types.ts
│   │   │   └── userDetail.inquery.ts
│   │   ├── swagger/
│   │   │   └── user.swagger.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── auth/                  # strategies/, guards/, types/ …
│   └── products/              # types/, entities/ …
│
├── common/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── decorators/
│   ├── middleware/
│   ├── constants/
│   └── types/
│
├── database/
│   ├── data-source.ts     # TypeORM 설정
│   ├── migrations/
│   └── seeds/
│
├── config/
│   ├── app.config.ts      # 앱 설정
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── env.validation.ts
│
└── test/                      # 도메인별
    ├── users/
    │   ├── user.service.spec.ts
    │   ├── user.controller.spec.ts
    │   └── user.e2e.spec.ts
    ├── auth/
    └── products/

# 백엔드 루트 (Docker — devops-docker.md)
Dockerfile
docker-compose.yaml            # postgres:15, redis:7-alpine 필수
.dockerignore
```

---

## app.module.ts

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      validate,
    }),
    TypeOrmModule.forRoot(dataSource.options),
    UserModule,
    AuthModule,
    ProductModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
```

---

## main.ts (진입점)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  // Helmet / Throttler / Swagger / Health → nestjs-security, nestjs-swagger, nestjs-health

  await app.listen(process.env.API_PORT || 3001);
}
bootstrap();
```

---

## package.json Scripts

```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate ./src/database/migrations",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert",
    "seed": "ts-node src/database/seeds/user.seed.ts",
    "docker:up": "docker compose up -d",
    "docker:db": "docker compose up -d postgres redis",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f"
  }
}
```

로컬 개발: `npm run docker:db` 후 `npm run start:dev` (또는 compose로 app까지).  
이미지·compose 규칙은 [`devops-docker.md`](../devops/devops-docker.md). Redis는 [`nestjs-redis.md`](./nestjs-redis.md).

---

## Module 예시 (UserModule)

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```

---

## 환경 변수

상세 규칙은 [`environment-variables.md`](../shared/environment-variables.md), [`nestjs-config-management.md`](./nestjs-config-management.md)를 따릅니다.  
필수: `DB_*`(Postgres 15), `REDIS_*`(Redis 7), `JWT_SECRET`, `API_PORT` 등 + `env.validation.ts`.
---

## 핵심 규칙

### DO ✅
- 기능별 모듈 (`modules/[feature]/`)
- 타입/DTO는 `types` (및 `dto`) 폴더에만
- 엔티티는 `entities/`, 테스트는 `test/[domain]/`
- 모듈에서 필요한 것만 export
- 글로벌 파이프/필터/인터셉터, 환경 변수로 설정 관리

### DON'T ❌
- 모듈 없이 컨트롤러/서비스 분산
- 파일 내 타입 정의
- 하나의 거대한 `app.module.ts`
- 하드코딩 설정값, 검증 없는 환경 변수

---

## 핵심 요약

1. `modules/[feature]/` + `common/` + `config/` + `database/`  
2. 타입은 feature `types/`/`dto/`, 테스트는 `test/[domain]/`  
3. 글로벌 ValidationPipe + ExceptionFilter  
4. 설정은 환경 변수 + `env.validation.ts`
