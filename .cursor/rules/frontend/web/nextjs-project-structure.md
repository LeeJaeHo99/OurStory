# Next.js Project Structure

Next.js 프로젝트의 구조 설정 및 초기 구성입니다.

---

## 프로젝트 초기화

```bash
npx create-next-app@latest project-name --typescript --tailwind
# 모노레포: npx create-next-app@latest web --typescript --tailwind
cd web && npm install && npm run dev  # http://localhost:3000
```

---

## App Router 폴더 구조

```
web/
├── src/
│   ├── app/                         # App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── (auth)/                  # 라우트 그룹
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── users/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # /users
│   │   │   ├── loading.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # /users/123
│   │   │       └── edit/page.tsx    # /users/123/edit
│   │   └── api/
│   │       ├── users/
│   │       │   ├── route.ts         # GET/POST /api/users
│   │       │   └── [id]/route.ts    # /api/users/123
│   │       └── auth/route.ts
│   │
│   ├── components/
│   │   ├── ui/                      # button, card, modal, input
│   │   ├── layout/                  # header, navigation, sidebar, footer
│   │   ├── users/                   # user-*.component.tsx
│   │   └── common/                  # loading, error, empty-state
│   ├── hooks/                       # use-*.hook.ts
│   ├── services/                    # *.service.ts
│   ├── providers/                   # *.providers.ts
│   ├── libraries/                   # *.library.ts
│   ├── stores/                      # Zustand, *.store.ts
│   ├── types/                       # [domain]/*.dto|types|enum.ts
│   ├── utils/
│   ├── tests/
│   ├── constants/
│   └── middleware.ts
│
│   ├── public/
│   │   ├── fonts/
│   │   ├── images/
│       └── videos/
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .eslintrc.json
├── package.json
└── README.md
```

기능별 폴더 권장 (`components` / `hooks` / `services` / `stores` / `types` / `utils`).  
타입별(`pages`/`styles`만 분리)은 지양.

---

## next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.example.com' }],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async redirects() {
    return [{ source: '/old-page', destination: '/new-page', permanent: true }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ],
    };
  },
  swcMinify: true,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "analyze": "ANALYZE=true next build"
  }
}
```

---

## 환경 변수

```
# .env.dev
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=MyApp
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=secret_key_for_dev
JWT_EXPIRATION=7d

# .env (프로덕션)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=MyApp
NEXT_PUBLIC_APP_URL=https://example.com
NEXTAUTH_SECRET=production_secret_from_env
JWT_EXPIRATION=24h

# .env.local (gitignore, 절대 커밋 금지)
NEXT_PUBLIC_DEBUG=true
```

프론트에서 노출할 값은 `NEXT_PUBLIC_` 접두사 필수.

---

## middleware.ts

```typescript
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPaths = ['/dashboard', '/profile', '/settings'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !request.cookies.get('token')?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
```

---

## 핵심 규칙

### DO ✅
- App Router (`src/app/`), 경로별 `layout.tsx` / `page.tsx`
- 라우트 그룹 `(auth)`, `(admin)` 활용
- 타입은 `types/`만, 컴포넌트는 `.component.tsx`
- 클라이언트 공개 env는 `NEXT_PUBLIC_`
- API Routes는 `app/api/`만

### DON'T ❌
- `pages`와 `app` 혼용
- 파일 안에 타입 정의, env 하드코딩
- 동적 라우트에 복잡한 로직
- 성능에 악영향 주는 라이브러리 무분별 사용

---

## 핵심 요약

1. `src/app` + `components` / `hooks` / `services` / `stores` / `types`  
2. App Router만 사용, 타입은 `types/`  
3. `NEXT_PUBLIC_*` + middleware로 보호 경로  
4. `next.config` / `tsconfig` paths `@/*`
