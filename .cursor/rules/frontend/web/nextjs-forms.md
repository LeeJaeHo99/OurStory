# Next.js Forms (Zod + React Hook Form)

폼은 **Zod 스키마 + React Hook Form + `zodResolver`** 로만 처리합니다.  
`useState` 수동 제어 폼·직접 if 검증은 쓰지 않습니다.

```bash
npm install react-hook-form zod @hookform/resolvers
```

제출은 TanStack Query mutation과 연결합니다 ([nextjs-data-fetching.md](./nextjs-data-fetching.md)).

---

## 흐름

```
1. Zod 스키마 정의 → z.infer로 타입
2. useForm({ resolver: zodResolver(schema) })
3. register / Controller + errors 표시
4. handleSubmit → mutation.mutate(data)
```

파일 위치 예:

```
src/
├── schemas/                 # 또는 types/[domain]/
│   └── create-book.schema.ts
└── components/books/
    └── CreateBookForm.component.tsx
```

---

## 1. Zod 스키마

```typescript
// schemas/create-user.schema.ts
import { z } from 'zod';

export const createUserSchema = z
  .object({
    email: z.string().email('올바른 이메일을 입력해주세요.'),
    name: z.string().min(2, '2자 이상 입력해주세요.').max(50),
    password: z
      .string()
      .min(8, '8자 이상')
      .regex(/[A-Z]/, '대문자 포함')
      .regex(/[0-9]/, '숫자 포함'),
    passwordConfirm: z.string(),
    age: z.coerce.number().int().min(0).max(150).optional(),
    tags: z.array(z.string()).max(10).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
```

자주 쓰는 API:

| API | 용도 |
|-----|------|
| `z.string().email/min/max/regex/url/trim()` | 문자열 |
| `z.coerce.number()` / `z.number().int().min().max()` | 숫자 (input은 문자열) |
| `z.enum([...])` / `z.boolean()` / `z.date()` | 열거·불린·날짜 |
| `z.array()` / 중첩 `z.object()` | 배열·객체 |
| `.pick` / `.omit` / `.extend` | 스키마 재사용 |
| `.refine` / `.superRefine` | 필드 간·커스텀 검증 |
| `.transform` | 제출 전 값 변환 |

```typescript
const updateUserSchema = createUserSchema.omit({ passwordConfirm: true }).partial();

const addressSchema = z.object({
  city: z.string(),
  zipCode: z.string(),
});

const profileSchema = z.object({
  name: z.string(),
  address: addressSchema,
});
```

---

## 2. React Hook Form + Zod

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserSchema,
  CreateUserFormData,
} from '@/schemas/create-user.schema';
import useCreateUser from '@/hooks/users/mutations/useCreateUser.mutation';

export default function CreateUserForm() {
  const { mutate, isPending } = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: 'onBlur', // onChange | onSubmit | onBlur
  });

  const onSubmit = (data: CreateUserFormData) => {
    mutate(data, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input type="email" {...register('email')} placeholder="Email" />
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      <div>
        <input {...register('name')} placeholder="Name" />
        {errors.name && <p>{errors.name.message}</p>}
      </div>
      <div>
        <input type="password" {...register('password')} />
        {errors.password && <p>{errors.password.message}</p>}
      </div>
      <div>
        <input type="password" {...register('passwordConfirm')} />
        {errors.passwordConfirm && <p>{errors.passwordConfirm.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting || isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

검증 규칙은 **스키마에만** 둡니다. `register('email', { required: ... })`처럼 RHF rules와 Zod를 섞지 않습니다.

---

## 3. watch · FieldArray · Controller

```typescript
// 조건부 필드
const enabled = watch('notificationsEnabled');
{enabled && <input {...register('email')} />}

// 동적 배열
const { fields, append, remove } = useFieldArray({ control, name: 'phones' });
fields.map((field, i) => (
  <div key={field.id}>
    <input {...register(`phones.${i}.number`)} />
    <button type="button" onClick={() => remove(i)}>Remove</button>
  </div>
));
<button type="button" onClick={() => append({ number: '' })}>Add</button>

// UI 라이브러리 / 커스텀 컴포넌트
<Controller
  name="role"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <>
      <Select {...field} options={[...]} />
      {error && <p>{error.message}</p>}
    </>
  )}
/>
```

---

## 핵심 규칙

### DO ✅
- Zod 스키마 + `z.infer` + `zodResolver`
- `register` / `Controller` + `errors.xxx.message`
- 제출은 mutation (`mutate`)
- 메시지는 한국어로 명확하게

### DON'T ❌
- `useState`로 폼 전체 제어
- 수동 `validateForm()` / `if (!email)` 검증
- Zod 쓰면서 `register`에 rules 중복
- 서버 컴포넌트에서 `useForm`

---

## 핵심 요약

1. 스키마(Zod) → 타입 → `zodResolver` → `useForm`  
2. UI는 `register`/`Controller`, 에러는 `formState.errors`  
3. 제출은 React Query mutation  
4. 폼 전용 문서는 이 파일 하나
