# Next.js Components

Next.js 컴포넌트 작성 패턴 및 모범 사례입니다.

---

## Server vs Client

```typescript
// Server (기본) — 직접 fetch 가능
async function fetchUsers(): Promise<User[]> {
  const res = await fetch('https://api.example.com/users');
  return res.json();
}

export default async function UsersPage() {
  const users = await fetchUsers();
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Client — 상호작용/브라우저 API 필요할 때만
'use client';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

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
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded ${variantStyles[variant]} ${className}`}
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
    <div className="border rounded p-4">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className="flex gap-2 mt-4">
        {onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
        {onDelete && <button onClick={() => onDelete(user.id)}>Delete</button>}
      </div>
    </div>
  );
}
```

---

## 상태 · 이벤트 · 조건부 · 리스트

```typescript
'use client';

const [count, setCount] = useState(0);
const handleIncrement = () => setCount(count + 1);

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  console.log('Changed:', e.target.value);
};

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// 조건부
if (isLoading) return <div>Loading...</div>;
if (error) return <div className="text-red-500">Error: {error}</div>;
return <div>{isAdmin ? 'Admin Panel' : 'User Panel'}</div>;
// {message && <div>{message}</div>}

// 리스트 — key 필수, 빈 배열 처리
if (users.length === 0) return <div>No users found</div>;
users.map((user) => <li key={user.id}>{user.name}</li>);
```

---

## 컴포지션

```typescript
// UserList → UserCard 조합
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

// children
interface CardProps {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="border rounded p-4">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

<Card title="User Profile">
  <p>User information here</p>
</Card>
```

---

## 디렉토리

```
components/
├── ui/           # button, card, input, modal (.component.tsx)
├── users/        # 도메인별
├── layout/       # header, sidebar, footer, navigation
└── common/       # loading, error, empty-state
```

---

## 폼 예제

```typescript
'use client';

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

## 핵심 규칙

### DO ✅
- Server Components 기본, 필요할 때만 `'use client'`
- Props는 `interface`로, 파일명 `.component.tsx`
- 도메인별 폴더, 재사용 UI 분리
- 핸들러 `handleXxx`, 조건부 렌더링 명확히

### DON'T ❌
- 전부 Client Component로
- Props 타입 없음, 과도한 props drilling
- 로직 과다 / 한 파일에 여러 컴포넌트
- `'use client'`를 루트에만 선언

---

## 핵심 요약

1. Server 기본 → 상호작용만 Client  
2. Props 타입 + `.component.tsx` + 도메인 폴더  
3. `handleXxx`, `key`, children 컴포지션  
4. 상태·이벤트는 Client에서만
