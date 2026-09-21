# NestJS Modules & Dependency Injection

NestJS의 모듈 시스템과 의존성 주입입니다.

---

## Module 기본

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 다른 모듈에서 사용
})
export class UsersModule {}

// 전역 — 남용하지 않기
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonModule {}
```

---

## Dependency Injection

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
}

// 다중 주입
@Injectable()
export class UserProfileService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private logger: LoggerService,
  ) {}
}

// 선택적 주입
@Injectable()
export class NotificationService {
  constructor(@Optional() private smsProvider?: SmsProvider) {}

  async sendNotification(phone: string, message: string) {
    if (this.smsProvider) {
      await this.smsProvider.send(phone, message);
    } else {
      console.log('SMS provider not available');
    }
  }
}
```

서비스는 항상 `@Injectable()`.

---

## Circular Dependency

```typescript
// 문제: UsersService ↔ PostsService 상호 주입
```

**해결 1 — `forwardRef`**

```typescript
constructor(
  @Inject(forwardRef(() => PostsService))
  private postsService: PostsService,
) {}

// 양쪽 모두 forwardRef 필요
```

**해결 2 — 공통 서비스로 분리 (권장)**

```typescript
@Injectable()
export class UserPostRelationService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Post) private postsRepository: Repository<Post>,
  ) {}
}
```

순환은 피하고, `forwardRef`는 최소한만 사용합니다.

---

## Custom Provider

```typescript
// Value
{ provide: 'DATABASE_CONFIG', useValue: databaseConfig }

constructor(@Inject('DATABASE_CONFIG') private config: typeof databaseConfig) {}

// Factory
{
  provide: 'DATABASE_CONNECTION',
  useFactory: async () =>
    createConnection({
      type: 'postgres',
      host: process.env.DB_HOST,
      // ...
    }),
}

// Class (환경별 구현 교체)
{
  provide: LoggerService,
  useClass:
    process.env.NODE_ENV === 'development' ? DevLoggerService : LoggerService,
}
```

---

## Dynamic Module

```typescript
@Module({})
export class DatabaseModule {
  static register(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          ...options,
          autoLoadEntities: true,
          synchronize: true,
        }),
      ],
    };
  }
}

// AppModule
DatabaseModule.register({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
```

---

## 모듈 임포트 패턴

```typescript
// Shared — 공용만 export
@Module({
  providers: [LoggerService, ValidationService],
  exports: [LoggerService, ValidationService],
})
export class SharedModule {}

// Feature
@Module({
  imports: [TypeOrmModule.forFeature([User, Profile])],
  controllers: [UsersController],
  providers: [UsersService, UserProfileService],
  exports: [UsersService, UserProfileService],
})
export class UsersModule {}

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment]), UsersModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

// Root
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({ /* ... */ }),
    UsersModule,
    PostsModule,
    AuthModule,
    CommonModule,
  ],
})
export class AppModule {}
```

```
src/
├── common/          # Shared / @Global
├── users/           # Feature (controller, service, entity, dto, module)
├── posts/
└── app.module.ts
```

---

## 핵심 규칙

### DO ✅
- 기능별 모듈 분리, 서비스는 `@Injectable()`
- 순환 의존 피하기 (`forwardRef` 또는 공통 서비스 분리)
- 공용은 Shared Module, `exports`는 필요한 것만
- 설정은 Dynamic Module로

### DON'T ❌
- 한 모듈에 전부 몰아넣기
- 순환 의존 방치 / `forwardRef` 남용
- `@Global()` 남용
- 타입·의존성 문서화 없음

---

## 핵심 요약

1. Feature Module + Shared/Common + Root AppModule  
2. DI로 Repository/Service 주입, `exports`로 공개  
3. 순환은 분리 우선, 불가피하면 `forwardRef`  
4. Custom / Dynamic Provider로 설정·구현 교체
