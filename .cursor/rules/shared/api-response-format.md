# API Response Format

모든 API 응답은 아래 포맷으로 통일합니다.

---

## 공통 타입

```typescript
interface Result<T = unknown> {
  isSuccess: boolean;
  data: T | null;
  message: string;
}
```

| 필드 | 성공 | 실패 |
|------|------|------|
| `isSuccess` | `true` | `false` |
| `data` | 값 또는 `null` | `null` (검증 에러는 예외) |
| `message` | 선택 | **필수** |

HTTP 상태코드(200/201/400…)는 정상적으로 유지하고, `isSuccess`와 일치시킵니다.  
응답은 **항상 JSON body**를 반환합니다 (204 사용 금지).

---

## 응답 예시

### 성공

```json
{
  "isSuccess": true,
  "data": { "id": 1, "name": "John" },
  "message": "조회 성공"
}
```

### 실패

```json
{
  "isSuccess": false,
  "data": null,
  "message": "사용자를 찾을 수 없습니다"
}
```

### 검증 에러 (400)

```json
{
  "isSuccess": false,
  "data": null,
  "message": "이메일 형식이 올바르지 않습니다"
}
```

### 페이지네이션

`data` 안에 `items` + `pagination` 고정:

```json
{
  "isSuccess": true,
  "data": {
    "items": [{ "id": 1 }],
    "pagination": {
      "page": 1,
      "size": 10,
      "totalSize": 50,
      "totalPages": 5
    }
  }
}
```

---

## NestJS 구현

컨트롤러는 **data만 return**하거나 **예외를 throw**합니다. `Result`를 직접 감싸지 않습니다.

### TransformInterceptor (전역)

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Result<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Result<T>> {
    return next.handle().pipe(
      map((data) => ({
        isSuccess: true,
        data: data ?? null,
        message: undefined,
      })),
    );
  }
}
```

### ExceptionFilter (전역, 모든 예외)

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = '서버 오류가 발생했습니다';
    let data: unknown = null;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const obj = body as { message?: string | string[]; errors?: unknown };
        message = Array.isArray(obj.message)
          ? obj.message.join(', ')
          : obj.message || message;
        if (obj.errors) data = { errors: obj.errors };
      }
    }

    res.status(status).json({ isSuccess: false, data, message });
  }
}
```

`main.ts`에서 **전역 등록**합니다.

---

## 핵심 규칙

### DO ✅
- 모든 응답: `{ isSuccess, data, message }`
- 전역 Interceptor + Filter로 포장
- 컨트롤러는 data만 return / throw
- 실패 시 `message` 필수, 사용자에게 이해 가능한 문구
- 페이지네이션: `data.items` + `data.pagination`

### DON'T ❌
- `success` 등 다른 필드명 사용
- `Result`를 컨트롤러에서 수동 생성
- 응답 포맷을 엔드포인트마다 다르게
- 비밀번호·토큰·스택트레이스를 `message`/`data`에 노출
- 204 No Content 사용

---

## 핵심 요약

1. 필드명: `isSuccess` / `data` / `message`
2. Interceptor로 성공 래핑, Filter로 실패 래핑
3. 컨트롤러는 비즈니스 data만 반환
4. HTTP 상태코드와 `isSuccess` 일치
