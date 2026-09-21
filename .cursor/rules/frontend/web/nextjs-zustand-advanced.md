# Zustand Advanced

Zustand 고급 상태 관리입니다.  
기본 Store·금지 규칙(Context 금지 등)은 [`nextjs-state-management.md`](./nextjs-state-management.md)를 따릅니다.

```bash
npm install zustand
npm install immer   # 선택
```

---

## 기본 Store

```typescript
interface AppState {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDarkMode: false,
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

const isDarkMode = useAppStore((state) => state.isDarkMode);
const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
```

---

## Middleware

### Immer (불변성)

```typescript
export const useUserStore = create<UserState>()(
  immer((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    updateUser: (updates) =>
      set((state) => {
        if (state.user) {
          state.user.name = updates.name || state.user.name;
          state.user.email = updates.email || state.user.email;
        }
      }),
    addRole: (role) =>
      set((state) => {
        if (state.user) state.user.roles.push(role);
      }),
  })),
);
```

### Persist (localStorage)

```typescript
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      fontSize: 16,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    },
  ),
);
```

### DevTools

```typescript
export const useDebugStore = create<DebugState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    { name: 'DebugStore' },
  ),
);
```

### 조합 (devtools → persist → immer)

```typescript
export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set) => ({
        items: [],
        total: 0,
        addItem: (item) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) existing.quantity += item.quantity;
            else state.items.push(item);
            state.total = state.items.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );
          }),
        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
            state.total = state.items.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );
          }),
        updateQuantity: (id, quantity) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (item) item.quantity = quantity;
            state.total = state.items.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );
          }),
        clear: () =>
          set((state) => {
            state.items = [];
            state.total = 0;
          }),
      })),
      { name: 'cart-storage' },
    ),
    { name: 'CartStore' },
  ),
);
```

---

## Async · Selector · Store 분리

```typescript
fetchData: async () => {
  set({ loading: true, error: null });
  try {
    const data = await (await fetch('/api/data')).json();
    set({ data, loading: false });
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Unknown error',
      loading: false,
    });
  }
};

// Selector — 필요한 값만
const userName = useUserStore((state) => state.user?.name);
const userInfo = useUserStore(
  (state) => ({ name: state.user?.name, email: state.user?.email }),
  (a, b) => a?.name === b?.name && a?.email === b?.email,
);

// 도메인별 분리 + index export
// stores/auth.store.ts, posts.store.ts, ui.store.ts, settings.store.ts
export { useAuthStore } from './auth.store';
export { usePostsStore } from './posts.store';
```

```
src/stores/
├── auth.store.ts
├── user.store.ts
├── posts.store.ts
├── ui.store.ts
├── settings.store.ts   # persist
└── index.ts
```

---

## Hook으로 추상화

```typescript
export function useUserSync() {
  const { user, fetchUser } = useUserStore();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) fetchUser(userId);
  }, [fetchUser]);

  return user;
}
```

---

## 핵심 규칙

### DO ✅
- Immer / Persist / DevTools 필요 시 사용
- Selector로 구독 최소화, Store 도메인 분리
- Async 액션은 store 안에

### DON'T ❌
- 단일 거대 Store, 깊은 중첩
- Persist 검증·타입 없이 사용
- 전체 상태 구독, Store에 과도한 비즈니스 로직

---

## 핵심 요약

1. `immer` / `persist` / `devtools` (필요 시 조합)  
2. Selector + 도메인별 Store  
3. Async는 store 액션  
4. 기본 규칙은 `nextjs-state-management.md`
