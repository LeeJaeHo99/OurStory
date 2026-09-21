# NestJS Caching

서버 캐시는 **Redis 7** (`CacheModule`)을 기본으로 합니다.  
인프라·모듈 등록은 [`nestjs-redis.md`](./nestjs-redis.md), Docker는 [`devops-docker.md`](../devops/devops-docker.md).

---

## 언제 캐시하나

| 적합 | 비적합 |
|------|--------|
| 읽기 많음·변경 적음 (설정, 카탈로그, 집계) | 실시간성 필수, 사용자별 민감 데이터(토큰·비밀번호) |
| 동일 조회가 반복되는 API | TTL 없이 오래 두는 write 데이터 |
| 외부 API 결과(짧은 TTL) | 쓰기 직후 즉시 일관성이 필수인 경로(무효화 없이) |

---

## 키 · TTL

```typescript
// 키: 도메인:식별자[:스코프]
`user:${id}`
`user:list:page:${page}:limit:${limit}`
`book:me:${userId}`

// TTL — 용도별 (ms, cache-manager)
const TTL = {
  short: 30_000,      // 30초 — 자주 바뀜
  medium: 60_000 * 5, // 5분 — 기본
  long: 60_000 * 60,  // 1시간 — 설정성
} as const;
```

- 키에 요청자/권한 스코프가 필요하면 반드시 포함 (`userId` 등)
- 민감값은 캐시하지 않거나 짧은 TTL + 최소 필드만

---

## Service에서 get/set · 무효화

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const key = `user:${id}`;
    const hit = await this.cache.get<User>(key);
    if (hit) return hit;

    const user = await this.users.findOne({ where: { id } });
    if (user) await this.cache.set(key, user, TTL.medium);
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.users.update(id, dto);
    const user = await this.users.findOneOrFail({ where: { id } });

    // 변경 후 관련 키 무효화
    await this.cache.del(`user:${id}`);
    await this.cache.del(`user:list:*`); // 패턴 삭제는 ioredis scan 등 — 단순 키면 목록 키를 명시적으로 del

    return user;
  }
}
```

목록 키는 `user:list:${page}:${limit}`처럼 **구체 키**를 쓰고, 변경 시 알고 있는 키를 `del` 합니다.  
와일드카드 삭제가 필요하면 Redis 클라이언트로 제한적으로 구현합니다.

---

## CacheInterceptor (선택)

읽기 전용·쿼리 단순 엔드포인트에만 사용합니다.

```typescript
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('settings')
@UseInterceptors(CacheInterceptor)
export class SettingsController {
  @Get()
  @CacheKey('settings:public')
  @CacheTTL(TTL.long)
  findPublic() {
    return this.settingsService.getPublic();
  }
}
```

인증·사용자별 응답에는 인터셉터 캐시를 쓰지 말고, Service에서 스코프 키로 처리합니다.

---

## 계층 정리

```
요청 → (Controller) → Service
         ↓ miss
       DB / 외부 API
         ↓ set + TTL
       Redis
```

프론트 TanStack Query 캐시와는 **별개**입니다.  
서버 캐시 무효화 ≠ 클라이언트 `invalidateQueries` (둘 다 필요할 수 있음).

---

## 규칙

### DO
- Redis + TTL + 도메인 접두사 키
- 쓰기(create/update/delete) 후 관련 키 `del`
- ConfigService로 host/port, Docker 시 `REDIS_HOST=redis`

### DON'T
- 프로세스 메모리 Map만으로 멀티 인스턴스 캐시
- 비밀번호·refresh token 등 시크릿 캐시
- 무효화 없는 “영구” 캐시
- 사용자별 데이터를 공용 `@CacheKey`로 캐시
