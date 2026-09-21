# Next.js Performance

Next.js 성능 최적화 및 모범 사례입니다.

---

## 이미지 (`next/image`)

```typescript
import Image from 'next/image';

// 고정 크기 + LCP면 priority
<Image src="/avatar.jpg" alt="Profile" width={200} height={200} priority />

// fill + 부모 relative
<div className="relative w-full h-96">
  <Image src="/hero.jpg" alt="Hero" fill className="object-cover" />
</div>

// 외부 이미지 — next.config.js remotePatterns 필요
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }],
}
```

---

## 코드 분할 · 번들

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // 클라이언트만
});

// app/users/page.tsx, app/users/[id]/page.tsx → 라우트별 자동 분할
```

```bash
npm install --save-dev @next/bundle-analyzer
# package.json: "analyze": "ANALYZE=true next build"
```

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({ /* ... */ });
```

```typescript
// ❌ import _ from 'lodash' / 전체 모듈
// ✅ 필요한 함수만, 또는 경량 구현
import { formatDate } from 'utils-lib';
```

---

## 캐싱

```javascript
// next.config.js — 브라우저/CDN
headers: async () => [
  {
    source: '/assets/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
  },
  {
    source: '/api/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=60, s-maxage=120' }],
  },
],
```

```typescript
// Server fetch ISR
await fetch(url, { next: { revalidate: 3600 } });

// API Route
return NextResponse.json(users, {
  headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' },
});
// select로 필요한 필드만
```

---

## 메타데이터 · SEO

```typescript
// 정적 — app/layout.tsx
export const metadata: Metadata = {
  title: 'My App',
  description: 'App description',
  icons: '/favicon.ico',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

// 동적 — app/users/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}`).then(
    (res) => res.json(),
  );
  return {
    title: user.name,
    description: user.bio,
    openGraph: { title: user.name, description: user.bio, images: [user.avatar] },
  };
}
```

---

## 렌더링 · 폰트 · 스크립트

```typescript
// Server Components 기본, 상호작용만 'use client'

// 비싼 계산 / 안정 콜백
const memoizedValue = useMemo(() => expensiveCalculation(), [dependency]);
const memoizedCallback = useCallback(() => handleClick(), [dependency]);

// next/font
import { Inter } from 'next/font/google';
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});
<html lang="ko" className={inter.className}>

// next/script
<Script src="https://analytics.example.com" strategy="lazyOnload" />
<Script src="https://cdn.example.com/script.js" strategy="afterInteractive" />
```

---

## Web Vitals

```typescript
import { Analytics } from '@vercel/analytics/react';
// layout: {children}<Analytics />

// 또는 web-vitals
'use client';
useEffect(() => {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}, []);
```

---

## 핵심 규칙

### DO ✅
- `next/image`, Server Components 기본, `dynamic` 분할
- 메타데이터·캐싱·Web Vitals
- 의존성 최소화, `next/font` / Script `strategy`

### DON'T ❌
- 전부 Client Component, 미최적화 이미지
- 불필요 번들·무거운 라이브러리 과다
- 메타데이터·캐싱 생략

### 체크리스트
- [ ] Image / dynamic / metadata / cache  
- [ ] bundle analyzer / Web Vitals  
- [ ] font / Script strategy / API select+Cache-Control  
- [ ] 의존성 최소화  

---

## 핵심 요약

1. Image + font + Script strategy  
2. Server 기본, heavy는 dynamic  
3. fetch/API/헤더 캐싱  
4. 번들 분석 + Web Vitals 모니터링
