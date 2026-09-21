# React Native State Management

상태 관리는 [`nextjs-state-management.md`](../web/nextjs-state-management.md)와 동일하게 **Zustand만** 사용합니다.  
Context API는 사용하지 않습니다. 영속화는 `localStorage` 대신 **AsyncStorage**입니다.

```bash
npm install zustand @react-native-async-storage/async-storage
```

---

## Zustand

```typescript
// stores/user.store.ts
interface UserStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

// 컴포넌트
const { user, clearUser } = useUserStore();
```

### 비동기 · Persist

```typescript
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  logout: () => set({ user: null }),
}));

// persist — AsyncStorage
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

### 여러 Store · Selector

```typescript
// stores/index.ts
export { useUserStore } from './user.store';
export { useAuthStore } from './auth.store';
export { useUIStore } from './ui.store';

export function useAppState() {
  const user = useUserStore();
  const auth = useAuthStore();
  return { user, auth, isAuthenticated: !!user.user };
}

// 필요한 값만 구독
const name = useUserStore((state) => state.user?.name);

const { user, isLoading } = useUserStore(
  useShallow((state) => ({
    user: state.user,
    isLoading: state.isLoading,
  })),
);
```

테마·UI 상태도 Context가 아니라 `ui.store.ts` 등으로 관리합니다.

---

## AsyncStorage

영속화는 Zustand `persist`를 우선 사용합니다.  
단순 키-값만 필요할 때만 유틸/훅을 씁니다.

```typescript
// utils/storage.utils.ts
export const storageUtils = {
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};

// hooks/use-local-storage.hook.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    storageUtils.getItem<T>(key).then((value) => {
      if (value != null) setStoredValue(value);
    });
  }, [key]);

  const setValue = async (value: T) => {
    setStoredValue(value);
    await storageUtils.setItem(key, value);
  };

  return [storedValue, setValue] as const;
}
```

AsyncStorage는 항상 비동기로 사용합니다.

---

## 상태 구조

```typescript
// ✅ 도메인별, 얕은 구조
interface AppState {
  user: { data: User | null; isLoading: boolean; error: string | null };
  ui: { sidebarOpen: boolean; theme: 'light' | 'dark' };
  auth: { token: string | null; isAuthenticated: boolean };
}

// ❌ 깊은 중첩
// user.profile.personal.info.name ...
```

Store는 `stores/[domain].store.ts`에 두고 분리합니다.

---

## 핵심 규칙

### DO ✅
- Zustand만 사용, 도메인별 Store 분리
- Selector / `useShallow`로 리렌더 최소화
- 영속화는 `persist` + AsyncStorage
- 상태 구조는 단순하게

### DON'T ❌
- Context API (`createContext` / `Provider` / `useContext`)로 앱 상태 관리
- Redux급 과도한 스택, 단일 거대 Store
- 깊은 중첩, AsyncStorage 동기식 사용
- 타입 없이 상태 접근

---

## 핵심 요약

1. Zustand + `stores/*.store.ts`만 (Next.js와 동일)  
2. 비동기는 store 액션, 영속화는 `persist` + AsyncStorage  
3. Selector로 구독 범위 최소화  
4. Context API 사용 금지
