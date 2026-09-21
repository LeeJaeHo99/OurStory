# Next.js Routing

Next.js App Router를 이용한 라우팅 및 네비게이션입니다.

---

## 파일 시스템 라우팅

```
src/app/
├── page.tsx                 # /
├── users/page.tsx           # /users
└── users/[id]/page.tsx      # /users/123
```

```typescript
export default function Home() {
  return <div>Welcome</div>;
}

interface UserPageProps {
  params: { id: string };
}

export default function UserPage({ params }: UserPageProps) {
  return <div>User {params.id}</div>;
}
```

---

## 동적 라우팅

```typescript
// [id] — /users/123 → params.id = "123"
export default function UserPage({ params }: { params: { id: string } }) {
  return <h1>User ID: {params.id}</h1>;
}

// 중첩 — /users/123/posts/456
export default function PostPage({
  params,
}: {
  params: { userId: string; postId: string };
}) {
  return (
    <h1>
      User {params.userId} Post {params.postId}
    </h1>
  );
}

// [...slug] — /docs/api/users → slug=["api","users"]
export default function DocsPage({ params }: { params: { slug: string[] } }) {
  return <h1>Docs: {params.slug.join('/')}</h1>;
}

// [[...slug]] — / → undefined, /about → ["about"]
export default function Page({ params }: { params: { slug?: string[] } }) {
  return <h1>Slug: {params.slug?.join('/') || 'root'}</h1>;
}
```

---

## 라우트 그룹 · 레이아웃

`(auth)` 등은 URL에 안 들어감 → `/login`, `/register`.

```typescript
// app/(auth)/layout.tsx — 인증 레이아웃
// app/(dashboard)/layout.tsx — 대시보드 레이아웃

// app/layout.tsx (루트)
export const metadata: Metadata = {
  title: 'My App',
  description: 'App description',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header>Header</header>
        {children}
        <footer>Footer</footer>
      </body>
    </html>
  );
}

// app/users/layout.tsx (중첩)
export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <aside className="w-1/4">Users Nav</aside>
      <main className="w-3/4">{children}</main>
    </div>
  );
}

// template.tsx — 페이지 전환마다 새로 렌더링 (layout과 다름)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

구조 예:

```
app/
├── page.tsx
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── dashboard/page.tsx
│   ├── users/page.tsx
│   ├── users/[id]/page.tsx
│   └── layout.tsx
└── api/users/route.ts
```

---

## 네비게이션 · Hooks (`'use client'`)

```typescript
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Link
<Link href="/">Home</Link>
<Link href={`/users/${userId}`}>User Profile</Link>
<Link href="/search?page=1&sort=name">Search</Link>
<Link href="/docs#introduction">Docs</Link>

// useRouter
const router = useRouter();
router.push('/dashboard');
router.back();
router.forward();
router.refresh();
router.prefetch('/users');

// 쿼리 반영
const params = new URLSearchParams();
params.set('page', '2');
params.set('sort', 'name');
router.push(`/users?${params.toString()}`);

// usePathname — 현재 경로 (active 스타일)
const pathname = usePathname();

// useSearchParams — /search?page=2&sort=date
const searchParams = useSearchParams();
const page = searchParams.get('page') || '1';
const sort = searchParams.get('sort') || 'name';
```

서버 컴포넌트에서는 `useRouter` / `useSearchParams` 사용 금지.

---

## 특수 파일

```typescript
// loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}

// error.tsx
'use client';
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}
```

---

## 핵심 규칙

### DO ✅
- 파일명 기반 라우팅, 동적은 `[id]`
- 라우트 그룹 `(auth)` / `(admin)`, 레이아웃으로 공통 UI
- 네비게이션은 `Link`, 프로그래밍 이동은 `useRouter` (클라이언트만)
- 쿼리는 `useSearchParams`

### DON'T ❌
- `<a>`로 내부 이동 (Link 사용)
- 미들웨어·컴포넌트에 복잡한 라우팅 로직
- 과도한 중첩 (`[a]/[b]/[c]/[d]`)
- 서버 컴포넌트에서 `useRouter`

---

## 핵심 요약

1. `page` / `layout` / `template` / `[param]` / `(group)`  
2. `Link` + 클라이언트 `useRouter` / `usePathname` / `useSearchParams`  
3. `loading` / `error` / `not-found` 특수 파일  
4. 라우트 그룹으로 레이아웃만 분리, URL은 깔끔하게
