# NestJS Validation

DTO + `class-validator` / `class-transformer`로 **요청을 검증**합니다.  
응답 직렬화(`@Expose` / `@Exclude` / `ClassSerializerInterceptor`)는 [`nestjs-class-transformer.md`](./nestjs-class-transformer.md)를 참고하세요.

```bash
npm install class-validator class-transformer
```

---

## DTO 기본

```typescript
// Create — 필수 필드
export class CreateUserDTO {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

// Update — 전부 optional
export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
```

---

## 자주 쓰는 데코레이터

| 종류 | 데코레이터 |
|------|------------|
| 문자열 | `@IsString`, `@IsNotEmpty`, `@MinLength`, `@MaxLength`, `@Matches`, `@IsAlpha`, `@IsAlphanumeric` |
| 숫자 | `@IsNumber`, `@IsInt`, `@Min`, `@Max`, `@IsDivisibleBy` |
| 이메일/URL | `@IsEmail`, `@IsUrl`, `@IsIP`, `@IsPhoneNumber('KR')` |
| Enum/UUID | `@IsEnum`, `@IsUUID` |
| 날짜 | `@IsDateString`, `@IsDate` |
| 배열 | `@IsArray`, `@ArrayMinSize`, `@ArrayMaxSize`, `@ArrayUnique`, `{ each: true }` |
| 선택/조건 | `@IsOptional`, `@ValidateIf` |

```typescript
@Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
password: string;

@IsArray()
@ArrayMinSize(1)
@IsNumber({}, { each: true })
itemIds: number[];

@ValidateIf((o) => o.notifyByPhone)
@IsNotEmpty()
phone?: string;
```

에러 메시지 커스터마이즈:

```typescript
@IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
email: string;
```

---

## 중첩 · 배열 객체

`@ValidateNested` + `class-transformer`의 `@Type`을 함께 씁니다.

```typescript
export class TagDto {
  @IsString()
  name: string;
}

export class CreateTaskDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags: TagDto[];
}

export class AddressDto {
  @IsString() street: string;
  @IsString() city: string;
}

export class CreateProfileDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

---

## 커스텀 검증

### 동기 (예: 비밀번호 강도)

```typescript
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password,
    );
  }
  defaultMessage(): string {
    return 'Password must contain uppercase, lowercase, number, and special character';
  }
}

export function IsStrongPassword(options?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
```

### 필드 비교 (Match)

```typescript
@ValidatorConstraint({ name: 'match', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const [related] = args.constraints;
    return value === (args.object as Record<string, unknown>)[related];
  }
  defaultMessage(args: ValidationArguments) {
    return `${args.property} must match ${args.constraints[0]}`;
  }
}

export function Match(property: string, options?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

// @Match('password') passwordConfirm: string;
```

### 비동기 (DB 중복 등)

```typescript
@ValidatorConstraint({ name: 'isEmailUnique', async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  async validate(email: string): Promise<boolean> {
    return !(await this.userService.findByEmail(email));
  }
  defaultMessage(): string {
    return 'Email already exists';
  }
}

// providers에 IsEmailUniqueConstraint 등록 필요
```

---

## ValidationPipe

```typescript
// main.ts — 전역 권장
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    stopAtFirstError: false,
  }),
);

// 특정 핸들러만
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
```

### 그룹 검증 (재사용 DTO)

```typescript
@IsEmail({}, { groups: ['create', 'update'] })
email: string;

@IsString({ groups: ['create'] })
password: string;

await validate(dto, { groups: ['create'] });
```

---

## 검증 실패 응답

ValidationPipe 실패는 전역 Filter가 [`api-response-format.md`](../shared/api-response-format.md) 형태로 변환합니다. 개념적으로:

```json
{
  "isSuccess": false,
  "data": {
    "errors": [
      { "field": "email", "message": "email must be an email" },
      { "field": "password", "message": "password must be longer than or equal to 8 characters" }
    ]
  },
  "message": "입력값을 확인해주세요"
}
```

---

## 핵심 규칙

### DO ✅
- 모든 요청 DTO에 class-validator 적용
- Create는 `@IsNotEmpty`, Update는 `@IsOptional`
- ValidationPipe 전역 (`whitelist` + `forbidNonWhitelisted` + `transform`)
- 중첩은 `@ValidateNested` + `@Type`
- 커스텀/비동기 검증은 `ValidatorConstraint`

### DON'T ❌
- 검증 없는 DTO, `any`
- ValidationPipe 없이 요청 처리
- 동기 검증에 비동기 DB 로직, 또는 그 반대
- 과도한 중첩 검증

---

## 핵심 요약

1. DTO + 데코레이터로 입력 검증  
2. 전역 ValidationPipe  
3. 커스텀은 Constraint, 중첩은 Nested + Type  
4. 에러 응답은 공통 API 포맷
