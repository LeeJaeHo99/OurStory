# NestJS Health & Observability

헬스체크는 Docker·로드밸런서·CD가 앱 준비 여부를 판단하는 데 사용합니다.  
인프라는 [`devops-docker.md`](../devops/devops-docker.md), CI/CD는 [`devops-cicd.md`](../devops/devops-cicd.md).

```bash
npm install @nestjs/terminus
# 관측(선택): @sentry/node 또는 nestjs-pino / winston
```

---

## 엔드포인트

| 경로 | 의미 | 실패 시 |
|------|------|---------|
| `GET /health` (liveness) | 프로세스 생존 | 재시작 대상 |
| `GET /ready` (readiness) | DB·Redis 등 의존성 준비 | 트래픽 제외 |

Throttler는 제외합니다 — [`nestjs-security.md`](./nestjs-security.md) `@SkipThrottle()`.

```typescript
@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator, // 커스텀 또는 microsite indicator
  ) {}

  @Get('health')
  @SkipThrottle()
  @Public()
  @HealthCheck()
  liveness() {
    // 프로세스 생존만 — 의존성 검사는 /ready
    return this.health.check([
      () => ({ app: { status: 'up' } }),
    ]);
  }

  @Get('ready')
  @SkipThrottle()
  @Public()
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

```typescript
// Redis indicator 예시
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {
    super();
  }

  async pingCheck(key: string) {
    try {
      const pong = await this.redis.ping();
      return this.getStatus(key, pong === 'PONG');
    } catch (e) {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false));
    }
  }
}
```

응답은 Terminus 기본 형식(`status`, `info`, `error`, `details`)을 써도 되고,  
외부 게이트웨이가 `Result`를 요구하면 래핑합니다. **LB는 HTTP 200/503**을 보면 됩니다.

---

## Docker · CD 연결

```yaml
# docker-compose app
healthcheck:
  test: ['CMD', 'wget', '-qO-', 'http://localhost:3001/ready']
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
```

```yaml
# CD / K8s 개념
livenessProbe:  GET /health
readinessProbe: GET /ready
```

CI에서 E2E 전에 `ready`가 200이 될 때까지 대기하는 것을 권장합니다.

---

## 관측 (최소)

| 항목 | 권장 |
|------|------|
| 구조화 로그 | requestId, method, path, status, duration (시크릿 제외) |
| 에러 추적 | Sentry 등 — DSN은 Secrets |
| 메트릭(선택) | 요청수, latency, health 실패 |

로깅 미들웨어는 [`nestjs-middleware-guards-interceptors.md`](./nestjs-middleware-guards-interceptors.md) 패턴을 따릅니다.

```typescript
// Sentry (선택)
Sentry.init({
  dsn: config.get('SENTRY_DSN'),
  environment: config.get('NODE_ENV'),
});
```

---

## 규칙

### DO
- `/health` + `/ready` 분리, Public + SkipThrottle
- ready에 Postgres·Redis ping 포함
- compose/K8s healthcheck에 `/ready` 연결

### DON'T
- ready에서 무거운 비즈니스 쿼리
- health에 인증 요구
- 로그에 토큰·비밀번호 출력
