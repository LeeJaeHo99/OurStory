# Error Handling

NestJS **내장 Exception**만 사용하고, 생성자에 **에러 메시지**만 넣습니다.  
커스텀 에러 코드(`AUTH_001` 등)나 커스텀 Exception 클래스는 만들지 않습니다.

응답 body 포맷은 [`api-response-format.md`](./api-response-format.md)를 따릅니다.

---

## 사용 규칙

서비스/가드에서 상황에 맞는 내장 Exception을 throw합니다.

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// ✅
throw new BadRequestException('이메일을 등록하여 주세요.');
throw new NotFoundException('유저가 존재하지 않습니다.');
throw new UnauthorizedException('로그인이 필요합니다.');
throw new ForbiddenException('접근 권한이 없습니다.');
throw new ConflictException('이미 존재하는 리소스입니다.');
throw new InternalServerErrorException('서버 에러가 발생하였습니다.');

// ❌
throw new BusinessException('AUTH_001', '...');
throw new Error('뭔가 잘못됨'); // HTTP Exception 대신 쓰지 않기
```

### 자주 쓰는 Exception

| Exception | 상태 | 언제 |
|-----------|------|------|
| `BadRequestException` | 400 | 잘못된 입력, 비즈니스 규칙 위반 |
| `UnauthorizedException` | 401 | 미인증 |
| `ForbiddenException` | 403 | 권한 없음 |
| `NotFoundException` | 404 | 리소스 없음 |
| `ConflictException` | 409 | 중복 등 충돌 |
| `InternalServerErrorException` | 500 | 예상치 못한 서버 오류 |

---

## 서비스 예시

```typescript
async getUserById(userId: string) {
  const user = await this.userRepository.findOne({ where: { id: userId } });

  if (!user) {
    throw new NotFoundException('유저가 존재하지 않습니다.');
  }

  return user;
}
```

컨트롤러는 try/catch로 감싸지 않습니다. throw만 하면 전역 Filter가 처리합니다.

---

## Exception Filter (전역)

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류가 발생했습니다.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const msg = (body as { message?: string | string[] }).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg || message;
      }
    }

    res.status(status).json({
      isSuccess: false,
      data: null,
      message,
    });
  }
}
```

`main.ts`에서 전역 등록:

```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

---

## 메시지 규칙

### DO ✅
- 사용자에게 보이는 **한국어** 메시지
- 무엇이 잘못됐는지 구체적으로 (`책이 존재하지 않습니다.`)
- HTTP 의미에 맞는 Exception 선택

### DON'T ❌
- 커스텀 에러 코드 / 커스텀 Exception 클래스
- 스택트레이스·SQL·시크릿을 message에 넣기
- 컨트롤러에서 예외를 catch해서 다른 포맷으로 재포장
- `throw new Error(...)`로 API 에러 처리

---

## 핵심 요약

1. Nest 내장 Exception + 메시지만 throw
2. 전역 Filter가 `{ isSuccess: false, data: null, message }`로 변환
3. 컨트롤러/서비스는 try/catch로 응답을 직접 만들지 않음