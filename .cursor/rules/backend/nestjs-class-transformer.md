# NestJS class-transformer

요청 **타입 변환·값 정제**와 응답 **직렬화(민감 필드 숨김)** 에 사용합니다.  
검증 데코레이터·ValidationPipe·중첩 `@ValidateNested`는 [`nestjs-validation.md`](./nestjs-validation.md)를 따릅니다.

```bash
npm install class-transformer
# 보통 class-validator와 함께 설치
```

**엔티티에 `@Exclude` + 전역 `ClassSerializerInterceptor`** 를 기본으로 합니다.

---

## 전역 직렬화 (권장)

```typescript
// main.ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

```typescript
// entity
@Exclude({ toPlainOnly: true })
password: string;

@Exclude({ toPlainOnly: true })
refreshToken: string;
```

응답 시 password 등이 자동으로 빠집니다.  
별도 Response DTO가 필요하면 아래 Expose 패턴을 씁니다.

---

## Expose / Exclude (Response DTO)

```typescript
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Exclude()
  password: string;

  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @Expose({ groups: ['admin'] })
  lastLogin: Date;
}

// plainToInstance (plainToClass는 deprecated)
return plainToInstance(UserResponseDto, user, {
  excludeExtraneousValues: true, // @Expose만 포함
  groups: ['admin'],             // 필요 시
});
```

| 옵션 | 의미 |
|------|------|
| `excludeExtraneousValues: true` | `@Expose`한 필드만 출력 |
| `groups` | 역할별 필드 노출 |
| `toPlainOnly` / `toClassOnly` | 직렬화/역직렬화 방향 제한 |

---

## Transform · Type (요청 DTO)

ValidationPipe `transform: true`와 함께 사용합니다.

```typescript
export class CreateUserDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  email: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  price: number; // "99.99" → number

  @Type(() => Boolean)
  isActive: boolean;

  @Type(() => Date)
  releaseDate: Date;
}
```

중첩 객체/배열:

```typescript
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;

@ValidateNested({ each: true })
@Type(() => TagDto)
tags: TagDto[];
```

---

## 커스텀 Transform (필요할 때만)

```typescript
@Transform(({ value }) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
})
metadata: Record<string, unknown>;

@Transform(({ value }) => value?.toISOString().split('T')[0])
date: string;
```

로직이 커지면 유틸 함수로 빼고, DTO 안에 복잡한 비즈니스 로직을 넣지 않습니다.

---

## 핵심 규칙

### DO ✅
- 민감 정보 `@Exclude` (엔티티 또는 Response DTO)
- Response DTO는 `@Expose` + `excludeExtraneousValues: true`
- 입력 정제는 `@Transform`, 타입 강제는 `@Type`
- `plainToInstance` 사용
- 전역 `ClassSerializerInterceptor` 권장

### DON'T ❌
- 비밀번호·토큰을 응답에 그대로 노출
- 모든 필드를 무분별하게 `@Expose`
- Transform에 과도한 비즈니스 로직
- deprecated `plainToClass` 사용

---

## 핵심 요약

1. 민감 필드 = `@Exclude` + `ClassSerializerInterceptor`  
2. Response DTO = `@Expose` + `plainToInstance`  
3. 요청 변환 = `@Transform` / `@Type` (+ validation 문서)  
4. 검증 규칙은 `nestjs-validation.md`
