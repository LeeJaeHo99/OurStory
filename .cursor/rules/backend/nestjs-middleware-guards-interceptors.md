# NestJS Middleware, Guards, Interceptors & Pipes

요청/응답 처리 및 인증·권한에 사용합니다.

**실행 순서:**  
요청 → 미들웨어 → 가드 → 인터셉터(전) → 파이프 → 컨트롤러 → 서비스 → 인터셉터(후) → 응답

---

## Middleware

컨트롤러 도달 **전** 처리. 주로 로깅/기록용. 요청 차단은 가드에 맡깁니다.

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      this.logger.log({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${Date.now() - start}ms`,
      });
    });
    next();
  }
}

// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    // .forRoutes({ path: 'users', method: RequestMethod.GET })
    // .exclude({ path: 'health', method: RequestMethod.GET }).forRoutes('*')
  }
}
```

---

## Guards

인증·권한 검증.

```typescript
// JWT
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

// @Public() 이면 스킵
canActivate(context: ExecutionContext) {
  const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
    context.getHandler(),
    context.getClass(),
  ]);
  if (isPublic) return true;
  return super.canActivate(context);
}

// Roles
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new UnauthorizedException('User not found');
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission');
    }
    return true;
  }
}

// 본인만
@Injectable()
export class IsOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user.id !== Number(req.params.id)) {
      throw new ForbiddenException('Cannot access other users data');
    }
    return true;
  }
}
```

```typescript
@Get('profile')
@UseGuards(JwtGuard)
getProfile(@User() user: User) { ... }

@Get('admin-only')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
getAdminData() { ... }

@Get(':id')
@UseGuards(JwtGuard, IsOwnerGuard)
getUser(@Param('id') id: number) { ... }

@Get('public')
@Public()
getPublicData() { ... }
```

---

## Interceptors

응답 변환·로깅·타임아웃 등.

```typescript
// 응답 래핑
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({ data, success: true, message: undefined })),
    );
  }
}

// 로깅
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.debug({
          method: req.method,
          path: req.path,
          duration: `${Date.now() - start}ms`,
        });
      }),
    );
  }
}

// 타임아웃
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          throw new RequestTimeoutException('Request timeout');
        }
        throw err;
      }),
    );
  }
}

// 전역 등록 (AppModule providers)
{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },

// 컨트롤러 단위
@UseInterceptors(LoggingInterceptor)
```

---

## Pipes

검증·변환. 복잡한 비즈니스 로직은 넣지 않습니다.

```typescript
@Get(':id')
getUser(@Param('id', ParseIntPipe) id: number) { ... }

@Get()
getUsers(
  @Query('page', ParseIntPipe) page: number,
  @Query('limit', ParseIntPipe) limit: number,
) { ... }
```

커스텀 예:

```typescript
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) throw new BadRequestException('Validation failed');
    return val;
  }
}
```

DTO 검증은 전역 `ValidationPipe` ([nestjs-validation.md](./nestjs-validation.md)).

---

## Decorators

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const Public = () => SetMetadata('isPublic', true);

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);
```

---

## 핵심 규칙

### DO ✅
- 인증 라우트에 `@UseGuards(JwtGuard)`
- 권한은 `@Roles()` + `RolesGuard`
- 미들웨어 = 로깅, 인터셉터 = 응답 변환/로깅, 파이프 = 검증·변환
- 가드 실행 순서 고려
- HTTP 보안(Helmet·CORS·Throttler)은 [`nestjs-security.md`](./nestjs-security.md)

### DON'T ❌
- 가드 없이 인증 라우트 노출
- 미들웨어에서 요청 차단
- 인터셉터에서 검증, 파이프에 복잡한 비즈니스 로직
- 인증 로직을 컨트롤러에 작성

---

## 핵심 요약

1. 순서: Middleware → Guard → Interceptor → Pipe → Controller  
2. Guard = 인증/권한, Pipe = 변환/검증, Interceptor = 응답/로깅  
3. `@Public` / `@Roles` / `@User` 데코레이터와 함께 사용  
4. Helmet / CORS / Throttler는 `nestjs-security.md`
