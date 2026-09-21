# Next.js Caching

프론트 데이터 캐시는 **TanStack Query**를 기본으로 합니다.  
페칭 구조는 [`nextjs-data-fetching.md`](./nextjs-data-fetching.md),  
상세 API는 [`nextjs-tanstack-query.md`](./nextjs-tanstack-query.md).

RN / Electron 렌더러도 동일하게 Query 캐시를 씁니다.  
([`rn-data-fetching.md`](../mobile/rn-data-fetching.md))

서버(Redis) 캐시는 [`nestjs-caching.md`](../../backend/nestjs-caching.md) — **별개 계층**입니다.

---

## 계층

| 계층 | 용도 | 도구 |
|------|------|------|
| 클라이언트 서버 상태 | API 응답 캐시·리페치 | TanStack Query |
| 클라이언트 UI 상태 | 테마·사이드바 등 | Zustand (`persist`는 영속화, 서버 캐시 아님) |
| HTTP / Next fetch | RSC·정적 자원 (선택) | `fetch` `revalidate` / `Cache-Control` |
| 백엔드 | 공유 서버 캐시 | Redis |

서버 상태(API)를 Zustand에 넣어 캐시하지 않습니다.

---

## QueryClient 기본값

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5분 — fresh 유지
      gcTime: 1000 * 60 * 10,    // 10분 — 미구독 후 GC (구 cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
```

| 옵션 | 의미 |
|------|------|
| `staleTime` | 이 시간 안엔 백그라운드 refetch 안 함 |
| `gcTime` | 구독자 없을 때 캐시 유지 시간 |
| `queryKey` | 캐시 슬롯 식별 — 계층화 필수 |

자주 안 바뀌는 마스터 데이터는 `staleTime`을 길게, 실시간성은 짧게 또는 `staleTime: 0`.

---

## queryKey · 무효화

```typescript
// keys
['books']
['books', 'me']
['books', bookId]
['books', { page, limit }]

// 읽기
useQuery({ queryKey: ['books', 'me'], queryFn: getMyBooks });

// 쓰기 후 — 관련 캐시 무효화
useMutation({
  mutationFn: createBook,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  },
});

// 즉시 반영이 필요하면 setQueryData / 낙관적 업데이트
// → nextjs-tanstack-query.md
```

---

## (선택) Server fetch 캐시

초기 HTML·ISR이 필요할 때만 사용합니다. 일반 CRUD·인증 API는 Query 패턴을 씁니다.

```typescript
await fetch(url, { next: { revalidate: 60 } }); // ISR
await fetch(url, { cache: 'no-store' });        // 매 요청
```

정적 자산 `Cache-Control`은 [`nextjs-performance.md`](./nextjs-performance.md).

---

## 규칙

### DO
- 서버 상태 = TanStack Query (`staleTime` / `gcTime` / `queryKey`)
- Mutation 성공 시 `invalidateQueries` (또는 `setQueryData`)
- queryKey 팩토리·계층화 (`['domain', ...scope]`)

### DON'T
- `useEffect` + 수동 Map/객체로 API 캐시
- API 응답을 Zustand에 캐시 용도로 저장
- 무효화 없는 stale 데이터 방치
- 서버 Redis와 클라이언트 캐시를 같은 것으로 취급

---

## 요약

1. API 캐시 = TanStack Query  
2. `staleTime` / `gcTime` / `queryKey` + mutation 후 invalidate  
3. Zustand persist ≠ 서버 상태 캐시  
4. 백엔드 Redis 캐시와 분리
