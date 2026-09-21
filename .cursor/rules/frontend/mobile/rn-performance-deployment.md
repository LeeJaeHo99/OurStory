# React Native Performance & Deployment

성능 최적화와 EAS 기반 배포입니다.

---

## 성능

### FlatList

```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ListItem item={item} />}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  removeClippedSubviews
  onEndReached={loadMore}
  onEndReachedThreshold={0.1}
  ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
/>
```

대량 리스트에 `ScrollView` + `map` 쓰지 않습니다.

### 메모이제이션 · 지연 로드

```typescript
const filteredItems = useMemo(
  () => items.filter((item) => item.title.length > 5),
  [items],
);

const handlePress = useCallback((id: string) => {
  console.log('Pressed:', id);
}, []);

// 무거운 화면 — lazy + Suspense (RN에서 제한적일 수 있음)
const HeavyComponent = lazy(() => import('@/screens/heavy.screen'));
<Suspense fallback={<ActivityIndicator />}>
  {showHeavy && <HeavyComponent />}
</Suspense>
```

필요한 경우에만 `useMemo` / `useCallback`을 씁니다.

### 이미지 · 메모리

```typescript
// ✅ 표시 크기에 맞는 URL + resizeMode + placeholder
<Image
  source={{ uri: optimizedUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="contain"
  defaultSource={require('@/assets/placeholder.png')}
/>

// useEffect 구독/타이머는 cleanup
useEffect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id);
}, []);
```

### 번들 분석

```bash
npm install -D react-native-bundle-visualizer
# package.json: "analyze": "react-native-bundle-visualizer"
```

---

## EAS Build · Submit

```bash
npm install -g eas-cli
eas login
eas build:configure

# iOS
eas build --platform ios --profile preview      # 개발/테스트
eas build --platform ios --profile production  # App Store
eas submit --platform ios --latest

# Android
eas build --platform android --profile preview     # APK 등 테스트
eas build --platform android --profile production  # AAB (Play)
eas submit --platform android --latest
```

```json
// eas.json
{
  "build": {
    "preview": { "ios": { "buildType": "archive" } },
    "production": { "ios": { "buildType": "archive" } }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

### Bare 로컬 (선택)

```bash
# Android release
cd android && ./gradlew assembleRelease   # APK
./gradlew bundleRelease                   # AAB

keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

---

## 버전 · OTA

```json
// app.json
{
  "expo": {
    "version": "1.0.0",
    "ios": { "buildNumber": "1" },
    "android": { "versionCode": 1 },
    "updates": {
      "enabled": true,
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

```bash
npm version patch|minor|major   # package.json 등과 맞춤
eas update:configure
eas update                      # 또는 --platform ios|android
```

---

## 테스트

```bash
npm install -D jest @testing-library/react-native
```

```json
{
  "jest": {
    "preset": "react-native",
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
    "testMatch": ["**/__tests__/**/*.test.(ts|tsx|js)"]
  }
}
```

```typescript
// 컴포넌트
render(<Button onPress={onPress} title="Press me" />);
fireEvent.press(screen.getByText('Press me'));
expect(onPress).toHaveBeenCalled();

// 훅
const { result } = renderHook(() => useSomething());
await waitFor(() => expect(result.current.isLoading).toBe(false));
```

데이터 페칭 훅은 [`rn-data-fetching.md`](./rn-data-fetching.md)의 Query 패턴을 테스트합니다.

---

## 배포 체크리스트 · 흐름

```
[ ] version / buildNumber / versionCode
[ ] 프로덕션 env
[ ] 콘솔 로그 제거
[ ] 에러 바운더리
[ ] 성능·모니터링 도구
[ ] 프라이버시 정책, 아이콘·스플래시, 스토어 설명·스크린샷
[ ] 테스트 → EAS 빌드 → 스토어 제출 → 모니터링
[ ] 필요 시 eas update (OTA)
```

```
개발 → 테스트 빌드 → 성능 점검 → 버전 업 → production 빌드
  → 스토어 제출 → 모니터링 → (OTA)
```

---

## 모니터링

```bash
npm install @sentry/react-native
```

```typescript
Sentry.init({
  dsn: 'https://your-sentry-dsn@sentry.io/project-id',
  tracesSampleRate: 1.0,
});

<Sentry.ErrorBoundary fallback={<Error />}>
  <RootNavigator />
</Sentry.ErrorBoundary>

export default Sentry.wrap(App);

// logger
LoggerService.error(message, error); // → Sentry.captureException
```

---

## 규칙

### DO
- 대량 데이터는 FlatList + 배치 옵션
- 이미지 리사이즈·placeholder, effect cleanup
- EAS Build/Submit, Sentry 등 에러 모니터링
- 필요할 때만 메모이제이션

### DON'T
- ScrollView로 긴 리스트
- 원본 초대형 이미지, 프로덕션 console.log
- 불필요 메모이제이션, 에러 처리 생략
