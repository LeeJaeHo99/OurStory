# Electron React Components

컴포넌트 작성 패턴은 [`nextjs-components.md`](../web/nextjs-components.md) / [`rn-components.md`](../mobile/rn-components.md)와 동일합니다.  
렌더러는 Vite React라 Server Component가 없고, DOM + **Tailwind**를 사용합니다.  
네이티브 기능은 [`electron-ipc-communication.md`](./electron-ipc-communication.md)의 `useIpc`로만 접근합니다.

---

## 작성 패턴

```typescript
// ui/button.component.tsx
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// users/user-card.component.tsx
interface UserCardProps {
  user: User;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  return (
    <div className="rounded border p-4">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className="mt-4 flex gap-2">
        {onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
        {onDelete && <button onClick={() => onDelete(user.id)}>Delete</button>}
      </div>
    </div>
  );
}

// ui/input.component.tsx — label / error 선택
<div className="flex flex-col gap-2">
  {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
  <input className={`rounded border px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'}`} {...props} />
  {error && <span className="text-sm text-red-500">{error}</span>}
</div>
```

---

## 상태 · 이벤트 · 조건부 · 리스트

```typescript
const [count, setCount] = useState(0);
const handleIncrement = () => setCount(count + 1);

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  console.log('Changed:', e.target.value);
};

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

if (isLoading) return <div>Loading...</div>;
if (error) return <div className="text-red-500">Error: {error}</div>;
return <div>{isAdmin ? 'Admin Panel' : 'User Panel'}</div>;
// {message && <div>{message}</div>}

if (users.length === 0) return <div>No users found</div>;
users.map((user) => <li key={user.id}>{user.name}</li>);
```

---

## 컴포지션

```typescript
export default function UserList({
  users,
  onEditUser,
  onDeleteUser,
}: {
  users: User[];
  onEditUser: (id: number) => void;
  onDeleteUser: (id: number) => void;
}) {
  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
        />
      ))}
    </div>
  );
}

interface CardProps {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="rounded border p-4">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}
```

---

## 디렉토리

```
renderer/components/
├── ui/           # button, card, input, modal, window-controls (.component.tsx)
├── users/        # 도메인별
├── layout/       # header, sidebar, footer
└── common/       # loading, error, empty-state, toast
```

아이콘은 `lucide-react`를 권장합니다.

---

## 폼 예제

```typescript
interface UserFormProps {
  onSubmit: (data: CreateUserDTO) => Promise<void>;
  isLoading?: boolean;
}

export default function UserForm({ onSubmit, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserDTO>({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" value={formData.name} onChange={handleChange} required />
      <input name="email" type="email" value={formData.email} onChange={handleChange} required />
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </Button>
    </form>
  );
}
```

---

## Electron 전용

### Window Controls + IPC

```typescript
// ui/window-controls.component.tsx
const { invoke } = useIpc();
const handleMinimize = () => invoke(IPC_CHANNELS.WINDOW.MINIMIZE);
const handleMaximize = () => invoke(IPC_CHANNELS.WINDOW.MAXIMIZE);
const handleClose = () => invoke(IPC_CHANNELS.WINDOW.CLOSE);

// macOS traffic lights / Windows 아이콘 버튼 — IPC만 호출
// main/ipc/window.ipc.ts: minimize / maximize↔unmaximize / close
```

타이틀바 드래그는 [`electron-project-structure.md`](./electron-project-structure.md)의 `-webkit-app-region`을 따릅니다.

### DropZone

```typescript
const [isDragging, setIsDragging] = useState(false);

<div
  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={(e) => {
    e.preventDefault();
    setIsDragging(false);
    onDrop(Array.from(e.dataTransfer.files));
  }}
  className={`rounded-lg border-2 border-dashed p-8 ${
    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
  }`}
>
  {children}
</div>
```

### Tabs · Modal · Sidebar · Toast (요약)

```typescript
// Tabs: activeTab state + tabs.map 버튼 + content
// Modal: isOpen 시 overlay + title / children / actions
// Sidebar: isOpen 너비 토글 + Link 메뉴 (react-router-dom)
// Toast: addToast(message, type) + 3초 후 제거 — UI 상태는 Zustand 권장
```

---

## 핵심 규칙

### DO ✅
- Props는 `interface`, 파일명 `.component.tsx`, 도메인별 폴더
- 핸들러 `handleXxx`, `key`, children 컴포지션
- Tailwind로 스타일, 아이콘은 lucide-react
- 네이티브는 `useIpc` / `IPC_CHANNELS`만

### DON'T ❌
- Props 타입 없음, 과도한 props drilling
- 로직 과다 / 한 파일에 여러 컴포넌트
- 렌더러에서 `require('electron')` / 메인 직접 접근
- 인라인 hex 하드코딩 남발, CSS-in-JS 기본화

---

## 핵심 요약

1. Next/RN과 동일: Props 타입 + `.component.tsx` + 컴포지션  
2. Tailwind + `handleXxx` + `key`  
3. Electron: WindowControls·DnD는 UI, 시스템 동작은 IPC
