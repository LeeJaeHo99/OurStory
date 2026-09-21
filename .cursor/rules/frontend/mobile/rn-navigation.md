# React Native Navigation

React Navigation 설정 및 구현입니다.

```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
```

---

## Stack Navigator

```typescript
// navigation/auth-navigator.tsx
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

### 파라미터 · 스크린 이동

```typescript
export type HomeStackParamList = {
  UsersList: undefined;
  UserDetail: { id: number; name: string };
};

<Stack.Screen
  name="UserDetail"
  component={UserDetailScreen}
  options={({ route }) => ({ title: route.params.name })}
/>

// 스크린
const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
navigation.navigate('UserDetail', { id, name });

const route = useRoute<NativeStackScreenProps<HomeStackParamList, 'UserDetail'>['route']>();
// route.params.id / route.params.name
```

---

## Bottom Tab

```typescript
export type RootTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

<Tab.Navigator
  screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: '#3b82f6',
    tabBarInactiveTintColor: '#9ca3af',
  }}
>
  <Tab.Screen
    name="Home"
    component={HomeNavigator}
    options={{
      tabBarLabel: 'Home',
      tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
    }}
  />
  <Tab.Screen name="Profile" component={ProfileScreen} /* tabBarLabel / tabBarIcon */ />
  <Tab.Screen name="Settings" component={SettingsScreen} />
</Tab.Navigator>
```

---

## Drawer

```bash
npm install @react-navigation/drawer
```

```typescript
const Drawer = createDrawerNavigator();

<Drawer.Navigator screenOptions={{ drawerType: 'slide', headerShown: true }}>
  <Drawer.Screen name="Home" component={HomeNavigator} options={{ drawerLabel: 'Home' }} />
  <Drawer.Screen name="Profile" component={ProfileScreen} options={{ drawerLabel: 'My Profile' }} />
</Drawer.Navigator>
```

---

## 인증 분기 + Tab/Stack 조합

```typescript
export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Root" component={HomeTabs} />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ animationEnabled: false }}
        />
      )}
    </Stack.Navigator>
  );
}

// HomeTabs: Tab(HomeStack | Profile)
// HomeStack: UsersList → UserDetail
// AuthStack: Login | Register (headerShown: false)
```

단순 분기만 필요하면 `isAuthenticated ? <HomeNavigator /> : <AuthNavigator />`도 가능합니다.

---

## 헤더

```typescript
// screenOptions
headerStyle: { backgroundColor: '#3b82f6' },
headerTintColor: '#ffffff',
headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
headerShown: true,

// 커스텀
header: () => <CustomHeader />, // goBack / title / menu
```

---

## 딥링킹

```typescript
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Login: 'login',
      Home: 'home',
      UserDetail: 'users/:id',
      NotFound: '*',
    },
  },
};

<NavigationContainer linking={linking}>
  <RootNavigator />
</NavigationContainer>

// myapp://users/123, https://myapp.com/users/123 → UserDetail
```

---

## Hooks · 스택 조작

```typescript
navigation.navigate('Detail', { id: 1 });
navigation.goBack();
navigation.pop();
navigation.replace('Home');
navigation.push('Detail', { id: 2 }); // 중복 허용
navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

useFocusEffect(
  useCallback(() => {
    // focus
    return () => {
      // blur
    };
  }, [])
);
```

---

## 규칙

### DO
- `ParamList` 타입 정의 후 `useNavigation` / `useRoute`로 타입 안전하게
- 인증 상태로 Auth / Home(Tab) 분기
- `useFocusEffect`로 포커스 시 로직
- 딥링킹·헤더 옵션 명시

### DON'T
- 타입 없이 `navigate`
- 과도한 Stack 중첩
- 네비게이션 로직을 스크린에 / `navigation`을 props로 전달
- 딥링킹 없이 URL 무시
