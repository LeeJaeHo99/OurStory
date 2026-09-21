# Next.js Data Fetching

클라이언트 데이터 페칭은 **서비스 함수 + TanStack Query** 패턴을 사용합니다.  
(OurStory: `services/*.api.ts` → `hooks/**/queries|mutations`)

캐시 전략(`staleTime`·무효화·계층)은 [`nextjs-caching.md`](./nextjs-caching.md),  
고급 Query API는 [`nextjs-tanstack-query.md`](./nextjs-tanstack-query.md).

```bash
npm install @tanstack/react-query
```

응답 래퍼는 [`api-response-format.md`](../../shared/api-response-format.md)의 `Result` (`isSuccess` / `data` / `message`)를 따릅니다.

---

## 폴더 구조

```
src/
├── services/
│   ├── base.api.ts          # 공통 fetch
│   ├── books.api.ts         # 도메인별 API 함수
│   └── users.api.ts
├── hooks/
│   └── books/
│       ├── queries/
│       │   └── useGetMyBooks.query.ts
│       └── mutations/
│           └── useCreateBook.mutation.ts
└── providers/
    └── ReactQuery.provider.tsx
```

---

## 1. base.api.ts

```typescript
import { Result } from '@/types/common/Result.type';

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = '요청에 실패했습니다.';
    try {
      const body = (await res.json()) as Result<null>;
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json();
}
```

- 토큰·베이스 URL·에러 메시지 추출은 여기서만
- 실패 시 `throw new Error(message)` → Query `onError` / UI에서 처리

---

## 2. 도메인 API (`*.api.ts`)

얇은 함수만 둡니다. 클래스 Service / `useEffect` fetch는 쓰지 않습니다.

```typescript
// services/books.api.ts
import { api } from './base.api';
import { Result } from '@/types/common/Result.type';
import { BookDetail, BookList } from '@/types/books/books.type';
import { CreateBookDto, UpdateBookDto } from '@/types/books/books.dto';

export function getAllBooks() {
  return api<Result<BookList[]>>('/books');
}

export function getMyBooks() {
  return api<Result<BookList[]>>('/books/me');
}

export function getBooksByUserId(userId: string) {
  return api<Result<BookList[]>>(`/books/users/${userId}`);
}

export function getBookById(bookId: string) {
  return api<Result<BookDetail>>(`/books/${bookId}`);
}

export function createBook(dto: CreateBookDto) {
  return api<Result<CreateBook>>('/books', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateBook(bookId: string, dto: UpdateBookDto) {
  return api<Result<UpdateBook>>(`/books/${bookId}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export function deleteBook(bookId: string) {
  return api<Result<Delete>>(`/books/${bookId}`, { method: 'DELETE' });
}
```

---

## 3. React Query Provider

```typescript
// providers/ReactQuery.provider.tsx
'use client';

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// app/layout.tsx
<ReactQueryProvider>{children}</ReactQueryProvider>
```

---

## 4. Query Hook

```typescript
// hooks/books/queries/useGetMyBooks.query.ts
import { getMyBooks } from '@/services/books.api';
import { useQuery } from '@tanstack/react-query';

export default function useGetMyBooks() {
  return useQuery({
    queryKey: ['books', 'me'],
    queryFn: getMyBooks,
    enabled: Boolean(
      typeof window !== 'undefined' && localStorage.getItem('accessToken'),
    ),
  });
}
```

| 규칙 | 예시 |
|------|------|
| 파일명 | `useGetXxx.query.ts` |
| queryKey | `['domain', ...scope]` → `['books', 'me']`, `['books', bookId]` |
| queryFn | `services`의 API 함수 그대로 |
| enabled | 인증 필요 시 토큰 있을 때만 |

```typescript
'use client';

const { data, isLoading, error } = useGetMyBooks();
const books = data?.data; // Result.data
```

---

## 5. Mutation Hook

```typescript
// hooks/books/mutations/useCreateBook.mutation.ts
import { createBook } from '@/services/books.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useCreateBook() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
}
```

| 규칙 | 예시 |
|------|------|
| 파일명 | `useXxx.mutation.ts` |
| mutationFn | API 함수 |
| onSuccess | 관련 `queryKey` invalidate |

---

## (선택) Server Component fetch

초기 HTML이 꼭 필요할 때만 사용합니다. 일반 CRUD·인증 API는 위 패턴을 씁니다.

```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books`, {
  next: { revalidate: 60 }, // ISR
  // cache: 'no-store',     // 매번 새로
});
```

---

## 핵심 규칙

### DO ✅
- `api()` + `*.api.ts` + Query/Mutation 훅
- `Result<T>`로 응답 타입 지정
- queryKey 계층화, mutation 후 invalidate
- 에러는 `base.api`에서 message throw

### DON'T ❌
- Client에서 `useEffect`로 직접 fetch / 로딩 상태 수동 관리
- API 클래스 Service 패턴
- 컴포넌트에서 URL·헤더 하드코딩
- queryKey 없이 캐시 무효화

---

## 핵심 요약

1. `base.api` → 도메인 `*.api` → `useXxx.query` / `useXxx.mutation`  
2. TanStack Query로 로딩·캐시·무효화  
3. 응답은 `Result`, 실패는 `Error(message)`  
4. `useEffect` fetch는 쓰지 않음
