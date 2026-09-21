# NestJS Security (Helmet · Throttler · CORS)

HTTP 보안은 **Helmet + Throttler + CORS**를 기본으로 켭니다.  
인증·인가(JWT/Roles)는 [`nestjs-jwt-auth.md`](./nestjs-jwt-auth.md),  
가드/미들웨어 실행 순서는 [`nestjs-middleware-guards-interceptors.md`](./nestjs-middleware-guards-interceptors.md).

```bash
npm install helmet @nestjs/throttler
```

**실행 순서(참고):**  
요청 → Helmet/CORS(프레임워크) → 미들웨어 → **ThrottlerGuard** → JwtGuard → …

---

## main.ts — Helmet · CORS

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ValidationPipe, global filters …
  await app.listen(config.getOrThrow('API_PORT'));
}
```

```
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

| | DO | DON'T |
|---|-----|--------|
| CORS | 허용 origin 화이트리스트 | `origin: true` / `*` + credentials |
| Helmet | 기본 적용 | 필요 시에만 개별 헤더 완화 |

---

## Throttler (레이트리밋)

```typescript
// app.module.ts
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: () => [
    {
      name: 'default',
      ttl: 60_000, // 1분
      limit: 100,  // 분당 100
    },
  ],
}),

providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  // Jwt는 글로벌 또는 라우트별 — Throttler가 먼저여도 OK
],
```

```typescript
// 인증 시도는 더 빡세게
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60_000 } })
login(@Body() dto: LoginDto) { ... }

// 헬스체크는 제외
@Get('health')
@SkipThrottle()
health() { ... }
```

| 구간 | 권장 |
|------|------|
| 기본 API | 분당 ~60–120 |
| login / refresh | 분당 ~5–10 |
| 업로드 | 분당 ~10–20 |
| `/health`, `/ready` | `@SkipThrottle()` |

---

## JWT와의 역할 분담

| 계층 | 담당 |
|------|------|
| Helmet | XSS/클릭재킹 등 브라우저 헤더 |
| CORS | 브라우저 출처 |
| Throttler | IP·라우트 남용 방지 |
| JwtGuard / RolesGuard | 신원·권한 |

레이트리밋만으로 인증을 대체하지 않습니다.  
공개 엔드포인트도 Throttler는 적용하는 편이 안전합니다 (`@Public()` ≠ `@SkipThrottle()`).

---

## 추가 권장

- `ValidationPipe({ whitelist, forbidNonWhitelisted })` 글로벌
- 프로덕션에서 Swagger `/docs` 제한 ([`nestjs-swagger.md`](./nestjs-swagger.md))
- 시크릿·비밀번호 로그 금지 ([`environment-variables.md`](../shared/environment-variables.md))
- HTTPS 종료는 리버스 프록시/로드밸런서에서

---

## 규칙

### DO
- Helmet + CORS 화이트리스트 + 글로벌 Throttler
- 로그인·업로드에 더 낮은 limit
- health/ready는 SkipThrottle ([`nestjs-health.md`](./nestjs-health.md))

### DON'T
- CORS `*` + credentials
- Throttler 없이 공개 brute-force 가능 엔드포인트
- 보안 헤더를 “나중에” 미룸
