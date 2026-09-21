# NestJS Redis

캐시·세션·큐 등에 **Redis 7**을 사용합니다.  
인프라는 Docker **`redis:7-alpine`** 고정 — [`devops-docker.md`](../devops/devops-docker.md).  
캐싱 전략(키·TTL·무효화·Interceptor)은 [`nestjs-caching.md`](./nestjs-caching.md).

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-yet
# 또는 ioredis 직접 사용
npm install ioredis
```

---

## 환경 변수

```
REDIS_HOST=localhost   # compose app 안에서는 redis
REDIS_PORT=6379
# 선택: REDIS_URL=redis://localhost:6379
```

`ConfigService`로만 읽고, 검증에 `REDIS_HOST` / `REDIS_PORT`를 포함합니다.  
([`nestjs-config-management.md`](./nestjs-config-management.md), [`environment-variables.md`](../shared/environment-variables.md))

---

## CacheModule (권장)

```typescript
// app.module.ts 또는 redis.module.ts
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => ({
    store: await redisStore({
      socket: {
        host: config.getOrThrow<string>('REDIS_HOST'),
        port: config.getOrThrow<number>('REDIS_PORT'),
      },
    }),
    ttl: 60_000, // ms
  }),
}),
```

```typescript
@Injectable()
export class UserService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async findCached(id: string) {
    const key = `user:${id}`;
    const hit = await this.cache.get(key);
    if (hit) return hit;

    const user = await this.userRepository.findOne({ where: { id } });
    if (user) await this.cache.set(key, user, 60_000);
    return user;
  }
}
```

---

## ioredis (직접 클라이언트)

```typescript
// redis/redis.module.ts
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.getOrThrow('REDIS_HOST'),
          port: config.getOrThrow('REDIS_PORT'),
        }),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
```

Bull/BullMQ 큐를 쓸 때도 동일하게 `REDIS_HOST` / `REDIS_PORT`(또는 URL)를 맞춥니다.

---

## 규칙

### DO
- Redis 7 (`redis:7-alpine`), host는 Docker 서비스명과 맞춤
- 캐시 키에 도메인 접두사 (`user:`, `session:`)
- TTL 명시, ConfigService로 접속 정보 주입

### DON'T
- 메모리 캐시만으로 프로덕션 세션/분산 캐시 대체
- Redis 접속 정보 하드코딩
- 민감 데이터를 TTL 없이 캐시
