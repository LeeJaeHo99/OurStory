# NestJS Exception Filters

글로벌 예외 필터 구현입니다.  
throw 규칙·메시지 규칙은 [`error-handling.md`](../shared/error-handling.md),  
응답 body는 [`api-response-format.md`](../shared/api-response-format.md)를 따릅니다.

- Nest **내장 Exception**만 사용 (커스텀 Exception 클래스 금지)
- 실패 응답: `{ isSuccess: false, data: null | { errors }, message }`

---

## 전역 Filter (`@Catch()`)

하나의 Filter로 모든 예외를 처리합니다.

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger?: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류가 발생했습니다.';
    let data: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const obj = body as { message?: string | string[]; errors?: unknown };
        message = Array.isArray(obj.message)
          ? obj.message.join(', ')
          : obj.message || message;
        if (obj.errors) data = { errors: obj.errors };
      }
    } else if (exception instanceof Error) {
      this.logger?.error('Unhandled Error', {
        error: exception.message,
        stack: exception.stack,
        path: req.url,
        method: req.method,
      });
      // 클라이언트에는 내부 메시지 노출하지 않음
      message = '서버 오류가 발생했습니다.';
    } else {
      this.logger?.error('Unknown Error', { exception, path: req.url });
    }

    if (status >= 500) {
      this.logger?.error('HTTP Exception', { status, path: req.url, message });
    } else {
      this.logger?.warn('HTTP Exception', { status, path: req.url, message });
    }

    res.status(status).json({
      isSuccess: false,
      data,
      message,
    });
  }
}
```

### 등록

```typescript
// main.ts
app.useGlobalFilters(new HttpExceptionFilter());

// 또는 AppModule
{ provide: APP_FILTER, useClass: HttpExceptionFilter }
```

ValidationPipe 실패(message 배열)도 위 Filter에서 `join`되어 `message`로 내려갑니다.  
별도 `ValidationExceptionFilter`는 두지 않습니다.

---

## 서비스에서 throw

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

throw new BadRequestException('이메일을 등록하여 주세요.');
throw new NotFoundException('유저가 존재하지 않습니다.');
throw new UnauthorizedException('로그인이 필요합니다.');
throw new ForbiddenException('접근 권한이 없습니다.');
throw new ConflictException('이미 존재하는 리소스입니다.');
throw new InternalServerErrorException('서버 에러가 발생하였습니다.');

// ❌ 커스텀 Exception / throw new Error(...)
```

컨트롤러·서비스는 try/catch로 응답을 직접 만들지 않습니다.

---

## 에러 응답 형식

```json
{
  "isSuccess": false,
  "data": null,
  "message": "유저가 존재하지 않습니다."
}
```

검증 에러 예:

```json
{
  "isSuccess": false,
  "data": null,
  "message": "email must be an email, password must be longer than or equal to 8 characters"
}
```

---

## 핵심 규칙

### DO ✅
- Nest 내장 Exception + 한국어 메시지
- 전역 `@Catch()` Filter 하나
- 응답: `isSuccess` / `data` / `message`
- 스택·SQL·시크릿은 로그에만

### DON'T ❌
- 커스텀 Exception 클래스 / 에러 코드
- `statusCode`·`timestamp`·`path`를 body에 넣어 포맷 깨기
- 모든 에러를 500으로, 기술 상세를 클라이언트에 노출
- 컨트롤러에서 예외를 catch해 다른 JSON으로 재포장

---

## 핵심 요약

1. throw = Nest 내장 Exception + message  
2. Filter = `{ isSuccess: false, data, message }`  
3. 전역 등록 1개로 충분  
4. 상세는 `error-handling.md` / `api-response-format.md`
