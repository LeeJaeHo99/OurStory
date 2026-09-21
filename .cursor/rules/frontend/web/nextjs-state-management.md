# Next.js State Management

Next.js에서의 상태 관리는 **Zustand만** 사용합니다.  
Context API는 사용하지 않습니다.

```bash
npm install zustand
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

// 컴포넌트 ('use client')
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const user = await res.json();
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

// persist
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
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

## LocalStorage

영속화는 Zustand `persist`를 우선 사용합니다.  
단순 키-값만 필요할 때만 훅을 씁니다.

```typescript
'use client';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.error('Failed to read localStorage:', error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Failed to write localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
```

클라이언트에서만 사용.

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
- localStorage는 클라이언트 + `persist`
- 상태 구조는 단순하게

### DON'T ❌
- Context API (`createContext` / `Provider` / `useContext`)로 앱 상태 관리
- Redux급 과도한 스택, 단일 거대 Store
- Server Component에서 클라이언트 상태 접근
- 깊은 중첩, localStorage 동기식 남용

---

## 핵심 요약

1. Zustand + `stores/*.store.ts`만  
2. 비동기는 store 액션, 영속화는 `persist`  
3. Selector로 구독 범위 최소화  
4. Context API 사용 금지
