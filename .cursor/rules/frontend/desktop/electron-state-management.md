# Electron State Management

상태 관리는 [`nextjs-state-management.md`](../web/nextjs-state-management.md) / [`rn-state-management.md`](../mobile/rn-state-management.md)와 동일하게 **Zustand만** 사용합니다.  
Context API는 사용하지 않습니다.

렌더러 UI 상태는 Zustand, 시스템·파일·앱 경로는 메인 + IPC입니다.  
([`electron-ipc-communication.md`](./electron-ipc-communication.md))

```bash
npm install zustand
# 메인 영속화(선택): electron-store
```

---

## Zustand (렌더러)

```typescript
// renderer/stores/user.store.ts
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
      // API 또는 IPC
      const user = await window.ipcApi.invoke(IPC_CHANNELS.USER.LOGIN, email, password);
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

// persist — 렌더러 localStorage (웹과 동일)
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: 'user-storage' },
  ),
);
```

디스크/앱 데이터 디렉터리에 둘 때는 `electron-store` + IPC를 쓰고, 상세는 [`electron-data-storage.md`](./electron-data-storage.md)를 따릅니다.

### 여러 Store · Selector

```typescript
// renderer/stores/index.ts
export { useUserStore } from './user.store';
export { useAuthStore } from './auth.store';
export { useUIStore } from './ui.store';
export { useFileStore } from './file.store';

export function useAppState() {
  const user = useUserStore();
  const auth = useAuthStore();
  return { user, auth, isAuthenticated: !!user.user };
}

const name = useUserStore((state) => state.user?.name);

const { user, isLoading } = useUserStore(
  useShallow((state) => ({
    user: state.user,
    isLoading: state.isLoading,
  })),
);
```

테마·사이드바 등 UI는 Context가 아니라 `ui.store.ts`로 관리합니다.

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

Store는 `renderer/stores/[domain].store.ts`에 둡니다.

---

## Electron: IPC 동기화

메인에만 있는 값(버전, 경로, 네이티브 결과)은 Store에 직접 넣지 말고 IPC로 가져옵니다.

```typescript
// main — getState + handle / send
ipcMain.handle(IPC_CHANNELS.APP.GET_VERSION, () => app.getVersion());
ipcMain.handle(IPC_CHANNELS.USER.FETCH, () => useUserMainStore.getState().user);
ipcMain.handle(IPC_CHANNELS.USER.UPDATE, (_e, user: User) => {
  useUserMainStore.getState().setUser(user); // 내부에서 send('user:changed', user)
  return { success: true };
});

// renderer — 초기 fetch + 구독
useEffect(() => {
  invoke(IPC_CHANNELS.USER.FETCH).then((user) => {
    if (user) useUserStore.setState({ user });
  });
  return on(IPC_CHANNELS.USER.CHANGED, (user: User) => {
    useUserStore.setState({ user });
  });
}, []);
```

메인에서 Zustand를 쓸 수도 있으나, **렌더러 UI 상태의 기본 소스는 `renderer/stores`입니다. 렌더러에서 `require('electron')`으로 메인에 직접 접근하지 않습니다.

---

## LocalStorage (렌더러)

영속화는 Zustand `persist`를 우선합니다.  
단순 키-값만 필요할 때:

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.error('Failed to read localStorage:', error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to write localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
```

---

## 핵심 규칙

### DO ✅
- Zustand만, 도메인별 `stores/*.store.ts`
- Selector / `useShallow`
- UI persist → `persist`(+ localStorage), 앱 데이터 → electron-store/IPC
- 메인↔렌더러 동기화는 IPC 채널 상수

### DON'T ❌
- Context API로 앱 상태 관리
- Redux급 스택, 단일 거대 Store, 깊은 중첩
- 렌더러에서 메인 모듈 직접 접근
- 전역 변수로 상태 공유, 타입 없이 접근

---

## 핵심 요약

1. Zustand + `renderer/stores/*.store.ts`만 (Next/RN과 동일)  
2. 비동기는 store 액션, UI 영속화는 `persist`  
3. Selector로 구독 최소화, Context 금지  
4. 시스템 상태는 IPC로 동기화
