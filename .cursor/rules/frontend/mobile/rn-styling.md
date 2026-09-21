# React Native Styling

스타일링은 **NativeWind(Tailwind)** 를 기본으로 사용합니다.  
`StyleSheet`은 NativeWind로 표현이 어렵거나 성능상 꼭 필요할 때만 보조로 씁니다.

```bash
npm install nativewind react-native-reanimated react-native-safe-area-context
npm install -D tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
```

---

## 설정

```javascript
// tailwind.config.js
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
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

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// App.tsx (또는 진입점)
import './global.css';
```

`metro.config.js`에 NativeWind 설정이 필요하면 공식 설치 가이드를 따릅니다.  
타입: `nativewind-env.d.ts`에 `/// <reference types="nativewind/types" />`

---

## 기본 사용

```typescript
export default function Screen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="mb-4 text-2xl font-bold text-black">Title</Text>
      <Text className="text-lg text-gray-600">Subtitle</Text>
    </View>
  );
}
```

### 조건부 · 동적 className

```typescript
<View
  className={`rounded-lg p-4 mb-3 ${
    variant === 'primary' ? 'bg-primary' : 'bg-secondary'
  }`}
>
  <Text className={variant === 'primary' ? 'text-white' : 'text-black'}>
    Card Content
  </Text>
</View>

<TouchableOpacity
  className={`rounded-lg p-3 ${pressed ? 'bg-blue-800' : 'bg-primary'}`}
  onPress={() => setPressed(!pressed)}
>
  <Text className="text-center text-white">Press me</Text>
</TouchableOpacity>
```

유틸 병합이 많으면 `clsx` / `tailwind-merge`를 사용합니다.

---

## 레이아웃 (Flexbox → Tailwind)

```typescript
<View className="flex-1">
  <View className="flex-1 bg-red-500" />
  <View className="flex-1 bg-blue-500" />
</View>

<View className="flex-row gap-2">
  <View className="flex-1 bg-red-500" />
  <View className="flex-1 bg-blue-500" />
</View>

<View className="flex-1 items-center justify-center">
  <Text>Centered</Text>
</View>
```

그림자·테두리:

```typescript
<View className="rounded-lg bg-white p-4 shadow-md elevation-5">
  <Text>Shadowed box</Text>
</View>

<View className="rounded-lg border border-gray-300 p-4">
  <Text>Bordered box</Text>
</View>
```

---

## 반응형 · 플랫폼

```typescript
// 너비 기반 — useWindowDimensions + 조건부 className
const { width } = useWindowDimensions();

<View className={`self-center ${width > 600 ? 'w-[70%]' : 'w-full'}`}>
  <Text>Responsive content</Text>
</View>

// 플랫폼 — Platform.select 또는 .ios.tsx / .android.tsx
import { Platform } from 'react-native';

<View className={Platform.OS === 'android' ? 'pt-6' : 'pt-0'}>
  <Text className={Platform.OS === 'ios' ? 'text-lg' : 'text-base'}>
    Platform aware
  </Text>
</View>
```

플랫폼 차이가 크면 [`rn-project-structure.md`](./rn-project-structure.md)의 `.ios.tsx` / `.android.tsx`를 사용합니다.

---

## 테마

테마는 Context가 아니라 Zustand (`ui.store` 등)로 관리합니다.  
([`rn-state-management.md`](./rn-state-management.md))

```typescript
// theme/colors.ts — Tailwind theme.extend.colors와 맞출 것
export const colors = {
  light: { background: '#fff', text: '#000', primary: '#3b82f6' },
  dark: { background: '#1a1a1a', text: '#fff', primary: '#60a5fa' },
};

// 컴포넌트
const theme = useUIStore((s) => s.theme); // 'light' | 'dark'

<View className={theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}>
  <Text className={theme === 'dark' ? 'text-white' : 'text-black'}>
    Themed content
  </Text>
</View>
```

색상·간격은 `tailwind.config.js` / `theme/`에 두고, 컴포넌트에 hex를 하드코딩하지 않습니다.

---

## StyleSheet (보조)

NativeWind로 부족한 경우만 사용합니다.

```typescript
const styles = StyleSheet.create({
  // 복잡한 계산 스타일, 애니메이션 중간값 등
});

<View className="flex-1 p-4" style={styles.computed} />
```

인라인 `style={{ ... }}`만으로 화면을 구성하지 않습니다.

---

## 예제

```typescript
// components/ui/card.component.tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'outlined';
}

export default function Card({ title, children, variant = 'default' }: CardProps) {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <View
      className={`mb-3 overflow-hidden rounded-lg ${
        variant === 'outlined'
          ? 'border border-secondary bg-white'
          : 'bg-white shadow-sm elevation-3'
      } ${isDark ? 'bg-neutral-900' : ''}`}
    >
      <View className="border-b border-secondary p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </Text>
      </View>
      <View className="p-4">{children}</View>
    </View>
  );
}
```

---

## 규칙

### DO
- **NativeWind `className`을 기본**으로 사용
- 색상·간격은 `tailwind.config` / theme 토큰
- 조건부 스타일은 className 조합 (`clsx` 등)
- Flexbox는 Tailwind 유틸 (`flex-1`, `flex-row`, `items-center`…)
- 테마는 Zustand, 플랫폼 차이는 `Platform` 또는 플랫폼 파일

### DON'T
- StyleSheet / 인라인 스타일만으로 UI 구성
- hex·절대 크기 하드코딩 남발
- Context로 테마 관리
- 플랫폼 차이 무시

---

## 요약

1. NativeWind + Tailwind가 기본  
2. `className`으로 레이아웃·색·간격·조건부 스타일  
3. StyleSheet는 보조만  
4. 테마 = Zustand, 토큰 = tailwind config
