# NestJS Swagger / OpenAPI

API 문서는 **Swagger(OpenAPI)** 로 유지합니다.  
컨트롤러·DTO 규칙은 [`nestjs-controller.md`](./nestjs-controller.md), [`nestjs-validation.md`](./nestjs-validation.md),  
응답 포맷은 [`api-response-format.md`](../shared/api-response-format.md) (`Result`)를 따릅니다.

```bash
npm install @nestjs/swagger
```

---

## main.ts 설정

```typescript
const config = new DocumentBuilder()
  .setTitle('API')
  .setDescription('Backend API')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',
  )
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document); // → /docs
```

- 개발/스테이징에서만 열거나, 프로덕션은 인증/비활성 처리
- 글로벌 prefix(`api/v1`)가 있으면 setup 경로와 맞출 것

---

## 컨트롤러 컨벤션

```typescript
@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: '사용자 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Result<User[]>' })
  getUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.userService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 단건' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Result<User>' })
  @ApiNotFoundResponse({ description: '사용자를 찾을 수 없습니다' })
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '사용자 생성' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Result<User>' })
  @ApiBadRequestResponse({ description: '검증 실패' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: '사용자 수정' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }
}
```

| 데코레이터 | 용도 |
|------------|------|
| `@ApiTags` | 그룹 (컨트롤러당 1) |
| `@ApiOperation` | summary 필수 |
| `@ApiBearerAuth` | JWT 엔드포인트 |
| `@ApiBody` / `@ApiQuery` / `@ApiParam` | 요청 스키마 |
| `@ApiOkResponse` 등 | 상태코드별 응답 |
| `@ApiExcludeEndpoint` | 문서에서 제외 |

공개 엔드포인트는 `@ApiBearerAuth`를 붙이지 않거나 `@Public()`과 맞춥니다.  
([`nestjs-jwt-auth.md`](./nestjs-jwt-auth.md))

---

## DTO · Result 스키마

```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ writeOnly: true, minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class ResultUserDto {
  @ApiProperty()
  isSuccess: boolean;

  @ApiProperty({ type: UserResponseDto, nullable: true })
  data: UserResponseDto | null;

  @ApiProperty()
  message: string;
}
```

- 요청 DTO: `@ApiProperty` / `@ApiPropertyOptional`
- 비밀번호 등: `writeOnly: true`
- 응답은 `Result<T>`를 문서에 명시

---

## 규칙

### DO
- 컨트롤러·DTO에 `@Api*` 유지 → `/docs`와 코드 동기화
- Tag = 도메인, Bearer 스키마 이름 (`access-token`) 통일

### DON'T
- 문서 없는 공개 API 추가
- 내부 전용 엔드포인트 무방비 노출
- DTO와 `@ApiProperty` 불일치
