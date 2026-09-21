# TypeScript Conventions

TypeScript를 안전하고 일관되게 쓰기 위한 규칙입니다.

---

## 타입 정의 위치

파일 안에 타입을 두지 않습니다. **types 폴더**에서만 관리합니다.

```
src/types/
├── users/
│   ├── user.dto.ts      # 요청 DTO
│   ├── user.types.ts    # 응답·일반 타입
│   └── user.enum.ts     # Enum
├── products/
│   └── ...
└── common/              # 공용 타입
    ├── Result.types.ts
    └── common.types.ts
```

| 파일 | 용도 |
|------|------|
| `[name].dto.ts` | 요청 DTO (`CreateUserDTO`, `UpdateUserDTO`) |
| `[name].types.ts` | Interface / Type (`User`, `UserProfile`) |
| `[name].enum.ts` | Enum만 |
| `common/` | 공용 타입 |
| 컴포넌트·서비스 파일 | ❌ 타입 정의 금지 |

```typescript
// ✅
import { CreateUserDTO } from '@/types/users/user.dto';
import { User } from '@/types/users/user.types';
import { UserRole } from '@/types/users/user.enum';

async function createUser(dto: CreateUserDTO): Promise<User> { ... }

// ❌ 서비스/컴포넌트 파일 안에 interface / type 정의
```

NestJS는 모듈 단위로 `src/modules/users/types/` 아래에 같은 규칙을 적용합니다.

---

## 기본 규칙

### `any` 금지

```typescript
// ✅
function handleData(data: unknown): void {
  if (typeof data === 'string') console.log(data.toUpperCase());
}

// ❌
function handleData(data: any): void { ... }
```

### Optional vs Null

```typescript
interface User {
  phone?: string;           // ✅ 필드 자체가 없을 수 있음
  nickname: string | null;  // ✅ 필드는 있고 값이 null일 수 있음
}

// ❌ id: number | undefined  → 없으면 id?: number
```

### Union vs Enum

```typescript
// 고정 집합 → Enum
enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

// 가벼운 문자열 집합 → Union
type ResponseState = 'success' | 'error' | 'loading';
```

### 반환 타입 명시

```typescript
// ✅
async function getUser(id: number): Promise<User> { ... }
function calculate(a: number, b: number): number { ... }

// ❌ 암시적 반환 타입
async function getUser(id: number) { ... }
```

### Readonly · Utility Types

```typescript
interface Config {
  readonly apiUrl: string;
}

type UserPreview = Partial<User>;
type UserName = Pick<User, 'id' | 'name'>;
type WithoutPassword = Omit<User, 'password'>;
type Permissions = Record<UserRole, string[]>;
```

### catch · assertion

```typescript
// ✅
catch (error: unknown) {
  if (error instanceof Error) console.error(error.message);
}

// ❌ catch (error: any)
// ❌ as any 체이닝, 불필요한 as
const user = getUserFromAPI() as User; // 불가피할 때만
```

---

## Generic

명확한 Generic 타입

```typescript
// ✅
interface Result<T> {
  data: T;
  message: string;
  isSuccess: boolean;
}

function parseData<T>(data: string): T { ... }
```

---

## tsconfig (권장)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`strict`를 끄지 않습니다.

---

## DO / DON'T

### DO ✅
- 타입은 `types/` (또는 모듈 `types/`)에만
- 함수 반환 타입 명시, `strict` 유지
- optional은 `?`, 명시적 null은 `| null`
- `unknown` + 타입 가드, Utility Types 활용

### DON'T ❌
- 파일 내 타입 정의, `any`, `as any` 체이닝
- `strict` 비활성화

---

## 핵심 요약

1. 타입은 `types/[domain]/[name].{dto|types|enum}.ts`에만  
2. `any` 금지, 반환 타입 명시, `strict` 유지  
3. `?` vs `| null` 구분, catch는 `unknown`
