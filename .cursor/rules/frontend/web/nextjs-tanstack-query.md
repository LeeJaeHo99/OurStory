# TanStack Query Advanced

기본 패턴(서비스 + hooks 구조)은 [`nextjs-data-fetching.md`](./nextjs-data-fetching.md),  
캐시 전략은 [`nextjs-caching.md`](./nextjs-caching.md)를 따릅니다.  
이 문서는 QueryClient 옵션, 페이지네이션/무한스크롤, Mutation·낙관적 업데이트, Query Key 계층화입니다.

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## QueryClient 설정

```typescript
// providers/ReactQuery.provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 10, // 10분 (구 cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## useQuery

```typescript
// 기본
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// 파라미터 + enabled
useQuery({
  queryKey: ['users', id],
  queryFn: () => fetchUser(id!),
  enabled: !!id,
});

// 페이지네이션
useQuery({
  queryKey: ['users', { page, limit }],
  queryFn: () => fetchUsers({ page, limit }),
});
```

### 무한 스크롤

```typescript
useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: undefined as string | undefined,
});

// UI: data.pages → fetchNextPage / hasNextPage / isFetchingNextPage
```

---

## useMutation

```typescript
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      // 캐시 직접 갱신
      queryClient.setQueryData(['users'], (old: User[] | undefined) => [
        ...(old || []),
        newUser,
      ]);
      // 또는 리페치
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

// UI: mutate / isPending / error
```

### 낙관적 업데이트

```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onMutate: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: ['users', updatedUser.id] });
      const previousUser = queryClient.getQueryData(['users', updatedUser.id]);
      queryClient.setQueryData(['users', updatedUser.id], updatedUser);
      return { previousUser };
    },
    onError: (_error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(['users', variables.id], context.previousUser);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', data.id], data);
    },
  });
}
```

---

## Query Invalidation

```typescript
onSuccess: () => {
  // ['users']로 시작하는 모든 쿼리
  queryClient.invalidateQueries({ queryKey: ['users'] });

  // 정확히 ['users']만
  queryClient.invalidateQueries({ queryKey: ['users'], exact: true });
}
```

---

## Query Key 계층화

```typescript
// constants/query-keys.ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: unknown) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

useQuery({
  queryKey: userKeys.list({ page: 1 }),
  queryFn: () => fetchUsers({ page: 1 }),
});

// invalidate: userKeys.all → users 관련 전부
```

---

## 에러 재시도

```typescript
useQuery({
  ...options,
  retry: (failureCount, error) => {
    if (error instanceof AxiosError) {
      return error.response?.status !== 404 && failureCount < 2;
    }
    return failureCount < 3;
  },
});
```

4xx는 재시도하지 않는 편이 안전합니다. API 레이어 에러는 [`nextjs-data-fetching.md`](./nextjs-data-fetching.md)의 `api()`에서 `throw`합니다.

---

## 규칙

### DO
- `useQuery`로 조회, `useMutation`으로 변경
- Query Key 계층화 (`userKeys` 패턴)
- `invalidateQueries` / `setQueryData`로 캐시 관리
- `enabled`로 조건부 실행
- 로딩·에러 상태 처리

### DON'T
- `useState`로 API 로딩/에러/데이터 관리
- Query Key 문자열 하드코딩 난립 (팩토리 없이 중복)
- Mutation 후 캐시 갱신 생략
- 에러 핸들링 생략
