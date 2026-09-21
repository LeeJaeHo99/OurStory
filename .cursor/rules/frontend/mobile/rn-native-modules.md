# React Native Native Modules

Expo 모듈로 네이티브 기능·권한을 다룹니다. 설치는 `npx expo install <pkg>`를 권장합니다.

---

## 공통: 권한

- `app.json` `plugins`에 권한 문구 설정
- 기능 사용 **전**에 권한 확인·요청
- 거부 시 강제 종료하지 말고 UI로 안내

```json
{
  "expo": {
    "plugins": [
      ["expo-camera", { "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera" }],
      ["expo-image-picker", { "photosPermission": "Allow $(PRODUCT_NAME) to access your photos" }],
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to access your location"
      }]
    ]
  }
}
```

각 모듈의 `request*Permissions` / `use*Permissions`를 사용합니다. (`expo-permissions` 통합 모듈은 deprecated에 가깝습니다.)

---

## Camera

```bash
npx expo install expo-camera
```

```typescript
const [permission, requestPermission] = Camera.useCameraPermissions();
const cameraRef = useRef<Camera>(null);
const [type, setType] = useState(CameraType.back);

if (!permission?.granted) {
  return (
    <TouchableOpacity onPress={requestPermission}>
      <Text>Grant camera permission</Text>
    </TouchableOpacity>
  );
}

const handleTakePicture = async () => {
  const photo = await cameraRef.current?.takePictureAsync();
  // photo?.uri
};

<Camera ref={cameraRef} type={type} style={{ flex: 1 }} />
// Flip: CameraType.back ↔ front
```

---

## ImagePicker (갤러리)

```bash
npx expo install expo-image-picker
```

```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 1, // 업로드 시 0.8 등 권장
});

if (!result.canceled) {
  setImage(result.assets[0].uri);
}
```

### 촬영/선택 → 업로드

```typescript
const formData = new FormData();
formData.append('file', {
  uri: photo,
  type: 'image/jpeg',
  name: 'photo.jpg',
} as any);

await uploadPhoto(formData); // services/*.api 패턴
```

흐름: 권한 → 촬영 또는 갤러리 → 미리보기 → FormData 업로드 → 로딩/에러 Alert.

---

## Location

```bash
npx expo install expo-location
```

```typescript
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') return;

const location = await Location.getCurrentPositionAsync({});
// location.coords.latitude / longitude
```

---

## Notifications

```bash
npx expo install expo-notifications
```

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 리스너
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log(response);
  });
  return () => sub.remove();
}, []);

await Notifications.scheduleNotificationAsync({
  content: { title: 'Hello!', body: 'This is a notification', data: { customData: 'test' } },
  trigger: { seconds: 2 },
});
```

---

## FileSystem

```bash
npx expo install expo-file-system
```

```typescript
const path = `${FileSystem.documentDirectory}${filename}`;

await FileSystem.writeAsStringAsync(path, content);
const content = await FileSystem.readAsStringAsync(path);
await FileSystem.deleteAsync(path);
const exists = (await FileSystem.getInfoAsync(path)).exists;
```

항상 비동기, `documentDirectory` 등 Expo 경로 사용.

---

## Device

```bash
npx expo install expo-device
```

```typescript
{
  brand: Device.brand,
  manufacturer: Device.manufacturer,
  modelName: Device.modelName,
  osName: Device.osName,
  osVersion: Device.osVersion,
  isPhone: Device.isDevice,
}
// Device.osName으로 ios / android 판별
```

---

## Bare: NativeModules

Expo로 부족한 기능만 Bare/prebuild 후 사용합니다.

```typescript
const { MyNativeModule } = NativeModules;
await MyNativeModule.myFunction();
```

---

## 지원 모듈 (Expo)

Camera, ImagePicker, Location, Notifications, FileSystem, Device, Contacts, Calendar 등 — [Expo docs](https://docs.expo.dev/)

---

## 규칙

### DO
- Expo 모듈 우선, `app.json` plugins에 권한
- 사용 전 권한 확인, 에러·사용자 피드백 포함
- 파일 경로 안전하게, 비동기 I/O

### DON'T
- 권한 없이 접근 / 거부 후 강제 종료
- 불필요한 권한 요청, 동기 파일 접근
- 에러 처리 생략
