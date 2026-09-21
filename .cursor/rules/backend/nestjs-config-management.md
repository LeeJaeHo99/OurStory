# NestJS Configuration Management

환경 설정 및 변수 관리입니다.  
파일 규칙(`.env` / `.env.local`)은 [`environment-variables.md`](../shared/environment-variables.md)도 참고하세요.

```bash
npm install @nestjs/config
```

---

## .env 예시

Docker(`postgres:15`, `redis:7-alpine`) 사용 시 host는  
호스트 실행 = `localhost`, compose `app` 안 = `postgres` / `redis`.  
자세한 compose는 [`devops-docker.md`](../devops/devops-docker.md).

```
# Database (PostgreSQL 15)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=myapp_db

# Redis 7
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=604800

# API
API_PORT=3001
API_PREFIX=api/v1
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

```
# .env.development
NODE_ENV=development
API_PORT=3001
DB_LOGGING=true
DEBUG=true

# .env.production
NODE_ENV=production
API_PORT=80
DB_LOGGING=false
DEBUG=false
```

---

## ConfigModule · configuration.ts

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
  load: [configuration],
  validate: validateEnvironment,
  cache: true,
}),

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('database.host'),
    port: config.get('database.port'),
    username: config.get('database.username'),
    password: config.get('database.password'),
    database: config.get('database.name'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: config.get('node_env') !== 'production',
    logging: config.get('database.logging'),
  }),
}),
```

```typescript
// src/config/configuration.ts
import { developmentConfig } from './environments/development';
import { productionConfig } from './environments/production';

export default () => {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = env === 'production' ? productionConfig : developmentConfig;

  return {
    node_env: env,
    ...envConfig,
    api: {
      port: parseInt(process.env.API_PORT) || 3001,
      prefix: process.env.API_PREFIX || 'api/v1',
      cors: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME || 'myapp',
      logging: process.env.DB_LOGGING === 'true',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION || '3600',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '604800',
    },
    debug: process.env.DEBUG === 'true',
  };
};

// environments/development.ts
export const developmentConfig = { logging: true, debug: true, cacheExpiry: 300 };

// environments/production.ts
export const productionConfig = { logging: false, debug: false, cacheExpiry: 3600 };
```

---

## Validation

```typescript
export class EnvironmentVariables {
  @IsString() NODE_ENV: string;
  @IsNumber() @IsOptional() API_PORT: number = 3001;
  @IsString() JWT_SECRET: string;
  @IsString() DB_HOST: string;
  @IsNumber() DB_PORT: number;
  @IsString() DB_USER: string;
  @IsString() DB_PASSWORD: string;
  @IsString() DB_NAME: string;
  @IsString() REDIS_HOST: string;
  @IsNumber() REDIS_PORT: number;
}

export async function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = await validate(validated);
  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }
  return validated;
}
```

---

## ConfigService 사용

```typescript
// get('database.host') / get('jwt.secret') 등 nested key
@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  getConnectionString(): string {
    const host = this.configService.get('database.host');
    const port = this.configService.get('database.port');
    const username = this.configService.get('database.username');
    const password = this.configService.get('database.password');
    const name = this.configService.get('database.name');
    return `postgres://${username}:${password}@${host}:${port}/${name}`;
  }

  isDevelopment() {
    return this.configService.get('node_env') === 'development';
  }
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      },
    );
  }
}
```

---

## registerAs (네임스페이스 캐싱)

```typescript
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.API_PORT) || 3001,
  prefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}));

ConfigModule.forFeature(appConfig);

constructor(
  @Inject(appConfig.KEY)
  private appConfiguration: ConfigType<typeof appConfig>,
) {}

getPort() {
  return this.appConfiguration.port;
}
```

---

## 핵심 규칙

### DO ✅
- `.env` + 환경별 파일, `ConfigService` 주입
- `validate`로 필수값 검증, 기본값 설정
- `load` / `registerAs`로 구조화·캐싱

### DON'T ❌
- 하드코딩, 환경변수 로깅
- 검증 없이 사용, 프로덕션 `DEBUG=true`
- `.env` git 커밋

### 배포 체크리스트
- [ ] 프로덕션 `.env` / Secrets  
- [ ] 필수 변수·민감정보  
- [ ] DB 연결·캐시·로깅 레벨  

---

## 핵심 요약

1. `ConfigModule.forRoot({ isGlobal, load, validate, cache })`  
2. `configuration.ts` + 환경별 오버레이  
3. 런타임은 `ConfigService` / `registerAs`만 사용  
4. 시크릿은 env, 코드에 하드코딩 금지
