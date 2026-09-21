# NestJS Controller

컨트롤러는 요청을 받아 서비스로 전달하고 응답을 반환합니다.  
비즈니스 로직·DB 접근은 하지 않습니다.

---

## 기본 구조 (CRUD)

```typescript
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ): Promise<{ items: User[]; total: number }> {
    return this.userService.findAll(page, limit);
  }

  @Get('search') // 구체적 경로를 :id 보다 먼저
  search(@Query('q') query: string) {
    return this.userService.search(query);
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Get(':userId/posts/:postId')
  getUserPost(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.userService.findUserPost(userId, postId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDTO): Promise<User> {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDTO,
    @User() user: User,
  ): Promise<User> {
    if (user.id !== id) {
      throw new ForbiddenException('Cannot update other users');
    }
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @User() user: User,
  ): Promise<void> {
    if (user.id !== id) {
      throw new ForbiddenException('Cannot delete other users');
    }
    return this.userService.delete(id);
  }
}
```

---

## 라우팅

| 메서드 | 경로 예 | 설명 |
|--------|---------|------|
| `@Get()` | `GET /user` | 목록 |
| `@Get('search')` | `GET /user/search` | 정적 경로 (파라미터보다 위) |
| `@Get(':id')` | `GET /user/123` | 단건 |
| `@Post()` | `POST /user` | 생성 |
| `@Patch(':id')` | `PATCH /user/123` | 수정 |
| `@Delete(':id')` | `DELETE /user/123` | 삭제 |

중첩: `@Get(':id/comments')`, `@Get(':userId/posts/:postId')`  
과도한 중첩(`:id/:subId/:subSubId`)은 피합니다.

---

## 요청 데이터 데코레이터

| 데코레이터 | 용도 |
|------------|------|
| `@Body()` | POST/PATCH 본문 (DTO) |
| `@Param()` | 경로 파라미터 |
| `@Query()` | 쿼리 문자열 |
| `@Headers()` | HTTP 헤더 |
| `@Request()` / `@Res()` | 전체 req/res (필요할 때만) |

숫자 변환·검증: `@Param('id', ParseIntPipe)`, `@Query('page', ParseIntPipe)`  
Body DTO 검증은 `main.ts` 전역 `ValidationPipe`에 맡깁니다.  
Swagger `@Api*` 컨벤션은 [`nestjs-swagger.md`](./nestjs-swagger.md),  
파일 업로드는 [`nestjs-file-upload.md`](./nestjs-file-upload.md).

---

## 상태 코드

- 기본: GET/PATCH/DELETE → 200, POST → 201
- 필요 시 `@HttpCode(HttpStatus.CREATED)` / `@HttpCode(HttpStatus.NO_CONTENT)` 등으로 지정

```typescript
@Get(':id')
getById(@Param('id') id: number) {
  return {
    data: this.userService.findOne(id),
    success: true,
    message: 'User retrieved successfully',
  };
}
```

---

## 커스텀 데코레이터 · 가드 · 인터셉터

```typescript
// common/decorators/user.decorator.ts
export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);

// common/decorators/roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('users')
@UseInterceptors(TransformInterceptor) // 컨트롤러 전체
export class UserController {
  @Get('profile')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('admin', 'user')
  getProfile(@User() user: User) {
    return user;
  }

  @Get('public') // 가드 없음 = 공개
  getPublicData() {
    return this.userService.getPublicData();
  }
}
```

---

## 핵심 규칙

### DO ✅
- `@Controller('단수형')`
- 메서드명 동사 시작, CRUD는 get/create/update/delete
- 구체적 경로를 `:id`보다 먼저
- `@Body` / `@Param` / `@Query`로 데이터 추출, 반환 타입 명시
- 필요 시 `@UseGuards` / `@UseInterceptors` / `@HttpCode`

### DON'T ❌
- 컨트롤러에서 DB 접근·비즈니스 로직
- 타입 검증 없이 요청 사용
- 과도한 중첩 경로
- 반환 타입 생략
- 인증 필요한데 가드 없음

---

## 핵심 요약

1. 컨트롤러 = 라우팅 + 위임만  
2. 단수형 경로, CRUD 데코레이터, Pipe로 파라미터 검증  
3. 로직은 Service, 인증은 Guard
