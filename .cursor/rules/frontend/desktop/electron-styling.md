# Electron Styling

렌더러(Chromium) 스타일링은 Next.js와 동일하게 **Tailwind CSS**를 기본으로 사용합니다.  
프로젝트 골격·진입점 CSS import는 [`electron-project-structure.md`](./electron-project-structure.md)를 따릅니다.

```bash
npm install -D tailwindcss postcss autoprefixer prettier-plugin-tailwindcss
npx tailwindcss init -p
# 선택: clsx tailwind-merge (조건부 className 병합)
```

---

## 설정

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#e5e7eb',
      },
    },
  },
  plugins: [],
};
```

```css
/* renderer/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Electron: 타이틀바 드래그 영역 */
body {
  -webkit-app-region: drag;
  user-select: none;
}
button,
input,
textarea,
select,
a,
[data-no-drag] {
  -webkit-app-region: no-drag;
  user-select: auto;
}
```

```typescript
// renderer/index.tsx
import './styles/globals.css';
```

PostCSS는 `postcss.config.js`에 `tailwindcss` + `autoprefixer`. Vite가 CSS를 처리하므로 추가 로더는 필요 없습니다.

---

## 기본 사용

```typescript
export default function Page() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="border-b px-4 py-3">
        <h1 className="text-2xl font-bold text-black">Title</h1>
        <p className="text-lg text-gray-600">Subtitle</p>
      </header>
      <main className="flex-1 overflow-auto p-4">{/* ... */}</main>
    </div>
  );
}
```

### 조건부 · 동적 className

```typescript
<div
  className={`mb-3 rounded-lg p-4 ${
    variant === 'primary' ? 'bg-primary text-white' : 'bg-secondary text-black'
  }`}
>
  Card Content
</div>

<button
  className={`rounded-lg px-3 py-2 ${pressed ? 'bg-blue-800' : 'bg-primary'} text-white`}
  onClick={() => setPressed(!pressed)}
>
  Press me
</button>
```

유틸 병합이 많으면 `clsx` / `cn`(`tailwind-merge`)을 사용합니다.  
UI 프리미티브는 [`nextjs-shadcn-ui.md`](../web/nextjs-shadcn-ui.md) 패턴을 그대로 쓸 수 있습니다(DOM 기반).

---

## 레이아웃

```typescript
<div className="flex h-full flex-1">
  <aside className="w-64 border-r bg-gray-50">{/* sidebar */}</aside>
  <main className="flex-1 overflow-auto p-4">{/* content */}</main>
</div>

<div className="flex flex-row gap-2">
  <div className="flex-1" />
  <div className="flex-1" />
</div>

<div className="flex flex-1 items-center justify-center">
  <p>Centered</p>
</div>

<div className="rounded-lg border border-gray-300 bg-white p-4 shadow-md">
  Card
</div>
```

---

## 반응형 · 플랫폼

```typescript
// Tailwind breakpoints (웹과 동일)
<div className="w-full md:w-1/2 lg:max-w-3xl">Responsive</div>

// OS별 미세 조정 — process.platform은 메인/preload로 노출하거나 navigator
<div className={isMac ? 'pl-20' : 'pl-2'}>{/* traffic lights 여백 등 */}</div>
```

윈도우 컨트롤 UI는 [`electron-react-components.md`](./electron-react-components.md).

---

## 테마

테마는 Context가 아니라 Zustand (`ui.store`)로 관리합니다.  
([`electron-state-management.md`](./electron-state-management.md))

```typescript
const theme = useUIStore((s) => s.theme); // 'light' | 'dark'

<div className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-black'}>
  Themed content
</div>
```

색상·간격은 `tailwind.config.js` / `theme/` 토큰에 두고 hex를 컴포넌트에 하드코딩하지 않습니다.  
다크모드를 class 전략으로 쓰려면 `darkMode: 'class'` + `html`/`root`에 `dark` 클래스를 토글합니다.

---

## 인라인 style (보조)

Tailwind로 부족한 동적 값(창 높이 계산 등)만 `style`을 보조로 씁니다.

```typescript
<div className="flex-1 overflow-auto" style={{ height: contentHeight }} />
```

인라인/`<style>`만으로 UI를 구성하지 않습니다.

---

## 규칙

### DO
- **Tailwind `className`을 기본**으로 사용 (Next.js와 동일)
- 색상·간격은 `tailwind.config` 토큰
- 조건부 스타일은 className 조합 (`clsx` / `cn`)
- 테마는 Zustand, 드래그 영역은 `-webkit-app-region`

### DON'T
- CSS-in-JS / 인라인 스타일만으로 UI 구성
- hex·절대 크기 하드코딩 남발
- Context로 테마 관리
- 클릭 가능한 컨트롤에 `drag` 영역 유지 (반드시 `no-drag`)

---

## 요약

1. Electron 렌더러 = 웹 → **Tailwind 기본** (Next.js와 동일 패턴)  
2. `className`으로 레이아웃·색·간격·조건부 스타일  
3. Electron만: `-webkit-app-region` 드래그/논드래그  
4. 테마 = Zustand, 토큰 = tailwind config
