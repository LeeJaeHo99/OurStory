# React Native Components

컴포넌트 작성 패턴은 [`nextjs-components.md`](../web/nextjs-components.md)와 동일합니다.  
RN은 Server Component가 없으며, DOM 대신 `View` / `Text` / `TouchableOpacity` / `FlatList` 등을 사용합니다.

---

## 작성 패턴

```typescript
// ui/button.component.tsx
interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function Button({
  children,
  onPress,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const variantStyles = {
    primary: { backgroundColor: '#3b82f6', color: '#fff' },
    secondary: { backgroundColor: '#e5e7eb', color: '#1f2937' },
    danger: { backgroundColor: '#ef4444', color: '#fff' },
  };
  const style = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        backgroundColor: style.backgroundColor,
        padding: 12,
        borderRadius: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: style.color, textAlign: 'center' }}>{children}</Text>
    </TouchableOpacity>
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
    <View style={{ borderWidth: 1, borderRadius: 8, padding: 16 }}>
      <Text style={{ fontWeight: 'bold' }}>{user.name}</Text>
      <Text>{user.email}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(user.id)}>
            <Text>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(user.id)}>
            <Text>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

---

## 상태 · 이벤트 · 조건부 · 리스트

```typescript
const [count, setCount] = useState(0);
const handleIncrement = () => setCount(count + 1);

// TextInput — onChangeText (웹의 onChange와 다름)
const handleChangeText = (value: string) => {
  setEmail(value);
};

const handleSubmit = async () => {
  await onSubmit(formData);
};

// 조건부
if (isLoading) return <Text>Loading...</Text>;
if (error) return <Text style={{ color: 'red' }}>Error: {error}</Text>;
return <Text>{isAdmin ? 'Admin Panel' : 'User Panel'}</Text>;
// {message && <Text>{message}</Text>}

// 리스트 — key / keyExtractor 필수, 빈 배열 처리
if (users.length === 0) return <Text>No users found</Text>;

// 소량: map / 대량·무한스크롤: FlatList 권장
users.map((user) => (
  <View key={user.id}>
    <Text>{user.name}</Text>
  </View>
));

<FlatList
  data={users}
  keyExtractor={(item) => String(item.id)}
  renderItem={({ item }) => <Text>{item.name}</Text>}
  onEndReachedThreshold={0.1}
  onEndReached={loadMore}
/>
```

---

## 컴포지션

```typescript
// UserList → UserCard
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
    <FlatList
      data={users}
      keyExtractor={(u) => String(u.id)}
      renderItem={({ item }) => (
        <UserCard user={item} onEdit={onEditUser} onDelete={onDeleteUser} />
      )}
      contentContainerStyle={{ gap: 16 }}
    />
  );
}

// children
interface CardProps {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 8, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

<Card title="User Profile">
  <Text>User information here</Text>
</Card>
```

---

## 디렉토리

```
components/
├── ui/           # button, card, input, modal (.component.tsx)
├── users/        # 도메인별
├── layout/       # header, tab-bar 등
└── common/       # loading, error, empty-state
```

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

  const handleChange = (name: keyof CreateUserDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <View style={{ gap: 16, padding: 16 }}>
      <TextInput
        placeholder="Name"
        value={formData.name}
        onChangeText={(v) => handleChange('name', v)}
      />
      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(v) => handleChange('email', v)}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={formData.password}
        onChangeText={(v) => handleChange('password', v)}
        secureTextEntry
      />
      <Button onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </Button>
    </View>
  );
}
```

---

## RN 전용 메모

```typescript
// 레이아웃 / 텍스트 / 터치
<View style={{ flex: 1, padding: 16 }} />
<Text>문자열은 반드시 Text 안</Text>
<TouchableOpacity onPress={...} activeOpacity={0.7} />

// ScrollView — 짧은 콘텐츠 / FlatList — 긴 리스트
<ScrollView>{/* 소량 */}</ScrollView>

// Image
<Image source={require('@/assets/logo.png')} style={{ width: 100, height: 100 }} />
<Image source={{ uri: url }} style={{ width: 50, height: 50, borderRadius: 25 }} />

// Modal
<Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
  {/* overlay + content */}
</Modal>
```

---

## 핵심 규칙

### DO ✅
- Props는 `interface`, 파일명 `.component.tsx`
- 도메인별 폴더, 재사용 UI 분리
- 핸들러 `handleXxx`, 조건부 렌더링 명확히
- 리스트는 `key` / FlatList의 `keyExtractor`
- 터치는 `TouchableOpacity`(또는 `Pressable`), 텍스트는 `Text`

### DON'T ❌
- Props 타입 없음, 과도한 props drilling
- 로직 과다 / 한 파일에 여러 컴포넌트
- `View`에 `onPress` (Touchable 사용)
- 긴 리스트에 `ScrollView` + `map` (FlatList 사용)
- 색상·크기 하드코딩 남발 (theme/constants)

---

## 핵심 요약

1. Next.js와 동일: Props 타입 + `.component.tsx` + 도메인 폴더 + 컴포지션  
2. `handleXxx`, `key`/`keyExtractor`, children  
3. RN: `View`/`Text`/`TouchableOpacity`, 대량 데이터는 `FlatList`
