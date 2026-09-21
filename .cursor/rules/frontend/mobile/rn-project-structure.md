# React Native Project Structure

React Native 프로젝트 구조 및 초기 구성입니다. 기본은 **Expo**입니다.

---

## Expo vs Bare

| | Expo (권장) | Bare |
|---|---|---|
| 생성 | `npx create-expo-app project-name` | `npx react-native init ProjectName --template react-native-template-typescript` |
| 장점 | 빠른 개발, EAS Build, 네이티브 수정 최소화 | 모든 네이티브 모듈, 완전 커스터마이징 |
| 단점 | 일부 네이티브 제한, 번들 큼 | 설정·빌드 복잡 |

시작은 Expo, 네이티브 커스텀이 필요할 때 Bare(또는 prebuild)로 전환합니다.

```bash
npx create-expo-app mobile --template
cd mobile && npm install && npm start
# iOS / Android: npm run ios | npm run android
```

---

## 폴더 구조

```
mobile/
├── app/
│   ├── App.tsx
│   ├── RootLayout.tsx
│   └── index.ts
├── src/
│   ├── screens/                 # *.screen.tsx (auth/, home/, users/…)
│   ├── components/
│   │   ├── ui/                  # button, card, input, modal
│   │   ├── common/              # loading, error, empty-state
│   │   └── [domain]/            # user-card 등
│   ├── navigation/              # root / auth / home navigator
│   ├── hooks/                   # use-*.hook.ts
│   ├── services/                # *.service.ts, api-client.ts
│   ├── stores/                  # Zustand *.store.ts
│   ├── types/                   # [domain]/*.dto|types|enum.ts, common/
│   ├── utils/
│   ├── constants/
│   ├── styles/
│   └── theme/                   # colors, typography, spacing
├── assets/                      # images, icons, fonts
├── app.json
├── package.json
├── tsconfig.json
└── .env.dev
```

---

## app.json (Expo)

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "myapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.example.myapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.example.myapp"
    },
    "web": { "favicon": "./assets/favicon.png" },
    "plugins": [
      ["expo-camera", { "cameraPermission": "카메라 접근 허용" }]
    ]
  }
}
```

---

## Scripts · TypeScript

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "eject": "expo eject",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "jest"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
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
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

---

## 환경 변수

클라이언트에 노출되는 값은 `EXPO_PUBLIC_` 접두사. 로컬은 `.env.dev`, 프로덕션은 `.env`.

```
# .env.dev
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_APP_NAME=MyApp
EXPO_PUBLIC_DEBUG=true

# .env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_NAME=MyApp
```

---

## 진입점 (App.tsx)

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '@/navigation/root-navigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

---

## 의존성

```bash
# 네비게이션
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler

# 상태 / API / 스타일 / 폼
npm install zustand axios nativewind tailwindcss react-hook-form
npm install -D typescript @types/react-native

# 옵션: expo-camera expo-image-picker expo-location expo-notifications
# 딥링크: @react-navigation/deep-linking
```

---

## 플랫폼별 파일

`.ios.tsx` / `.android.tsx`를 두면 플랫폼에 맞게 자동 로드됩니다. 공통 `Button.tsx`는 두지 않아도 됩니다.

```typescript
// Button.ios.tsx → TouchableOpacity
// Button.android.tsx → Pressable
import Button from '@/components/button';
```

---

## 규칙

### DO
- Expo로 시작 (Bare는 필요 시)
- 접미사: `.screen.tsx`, `.component.tsx`
- 타입은 `types/`만, 네비게이션은 React Navigation, 상태는 Zustand
- API는 client로 추상화
- 플랫폼 차이는 `.ios.tsx` / `.android.tsx`

### DON'T
- 타입을 컴포넌트 파일에 분산
- 색상/크기 하드코딩 (theme/constants 사용)
- 과도한 prop drilling
- 네비게이션 로직을 스크린에 넣기
