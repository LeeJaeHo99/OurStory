# NestJS Custom Decorators

맞춤형 데코레이터 작성 및 활용입니다.

---

## 파라미터 데코레이터

```typescript
// @CurrentUser
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);

@Get('me')
@UseGuards(AuthGuard('jwt'))
getCurrentUser(@CurrentUser() user: User) {
  return user;
}

// @CurrentUserId
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user?.id,
);

@Post('posts')
@UseGuards(AuthGuard('jwt'))
createPost(
  @CurrentUserId() userId: string,
  @Body() createPostDto: CreatePostDto,
) {
  return this.postsService.create(userId, createPostDto);
}
```

---

## 메서드 데코레이터 (SetMetadata)

```typescript
export const IsPublic = () => SetMetadata('isPublic', true);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const Throttle = (limit: number, ttl: number) =>
  SetMetadata('throttle', { limit, ttl });

@Get()
@IsPublic()
findAll() { ... }

@Get('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'moderator')
getUsers() { ... }

@Post('login')
@Throttle(5, 60) // 60초에 5번
login(@Body() loginDto: LoginDto) { ... }
```

---

## 복합 데코레이터 (applyDecorators)

```typescript
// 중첩 DTO
export function ValidateNestedDto(dtoClass: unknown) {
  return applyDecorators(ValidateNested(), Type(() => dtoClass));
}

@ValidateNestedDto(CreateProfileDto)
profile: CreateProfileDto;

// Swagger 묶음
export function ApiDocumented(summary: string, description: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiResponse({ status: 200, description: 'Success' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

@Get()
@ApiDocumented('Get all users', 'Retrieve a list of all users')
findAll() { ... }

// JWT 보호 묶음
export function Protected() {
  return applyDecorators(UseGuards(AuthGuard('jwt')));
}

@Get('me')
@Protected()
getCurrentUser(@CurrentUser() user: User) {
  return user;
}
```

---

## 프로퍼티 데코레이터

```typescript
export const TransformEmail = () =>
  Transform(({ value }) => value?.toLowerCase().trim());

@IsEmail()
@TransformEmail()
email: string;

// Response DTO
export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() name: string;
  @Exclude() password: string;
  @Exclude() createdAt: Date;
}

return plainToClass(UserResponseDto, user, {
  excludeExtraneousValues: true,
});
```

---

## Guard와 함께

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}

@Injectable()
export class PublicGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

사용 예:

```typescript
@Get() @IsPublic() findAll() { ... }

@Post()
@UseGuards(AuthGuard('jwt'))
create(@CurrentUserId() userId: string, @Body() dto: CreatePostDto) { ... }

@Delete(':id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
delete(@Param('id') id: string) { ... }

@Get('my')
@UseGuards(AuthGuard('jwt'))
getMyPosts(@CurrentUser() user: User) { ... }
```

---

## 핵심 규칙

### DO ✅
- 파라미터 데코레이터로 요청 데이터 추출
- 메타데이터(`SetMetadata`)로 권한·공개 여부 관리
- `applyDecorators`로 재사용
- Guard와 함께 사용, 타입 명확히

### DON'T ❌
- 과도한 데코레이터 체이닝
- 데코레이터에 비즈니스 로직
- 타입·문서화 생략

---

## 핵심 요약

1. `@CurrentUser` / `@CurrentUserId` — 파라미터  
2. `@IsPublic` / `@Roles` / `@Throttle` — 메타데이터  
3. `@Protected` / `@ApiDocumented` — 복합  
4. Reflector + Guard로 메타데이터 읽기
