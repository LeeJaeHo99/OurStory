# Naming Conventions

모든 코드는 아래 네이밍 규칙을 따릅니다.

---

## 기본

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 / 함수 | camelCase | `userName`, `calculateTotal` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 클래스 / Interface / Type / Enum | PascalCase | `UserService`, `UserRole` |
| Private 멤버 | `_` 접두사 | `_password`, `_validate()` |

```typescript
// ✅
const userName = 'John';
const isActive = true;
const MAX_RETRY_COUNT = 3;
class UserService {}
interface User {}
type UserResponse = { id: number };

// ❌
const user_name = 'John';
const UserName = 'John';       // 변수에 PascalCase
interface IUser {}            // I 접두사
```

---

## Boolean

**변수/함수**는 `is` / `has` / `can` / `did` / `should` 접두사.

```typescript
// ✅
const isActive = true;
const hasPermission = false;
const canEdit = true;
const shouldRetry = true;
function isValidEmail(email: string): boolean { ... }
function hasPermission(user: User, action: string): boolean { ... }

// ❌
function validateEmail(email: string): boolean { ... }  // boolean인데 is/has/can 없음
function checkPermission(user: User): boolean { ... }
```

---

## 배열 · Enum · Type

```typescript
// 배열: 복수형 또는 xxxList
const users = [];
const userList = [];
// ❌ const user = [];  const userArr = [];

// Enum: 이름은 PascalCase, 값은 UPPER_SNAKE_CASE
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// Interface / Type: I 접두사 금지
interface User { id: number }
type UserDTO = { id: number }
```

---

## 함수

동사로 시작. CRUD는 `get` / `create` / `update` / `delete`.

```typescript
function calculateTotal(items: Item[]): number { ... }
async function getUser(id: number): Promise<User> { ... }
async function getUserByEmail(email: string): Promise<User> { ... }
async function createUser(dto: CreateUserDTO): Promise<User> { ... }
async function updateUser(id: number, dto: UpdateUserDTO): Promise<User> { ... }
async function deleteUser(id: number): Promise<void> { ... }
```

프론트:
- 이벤트: `handleXxx` (`handleClick`, `handleSubmit`)
- Hook: `useXxx` (`useUser`, `useAuth`)
- API: `fetchXxx` 또는 `apiClient.xxx`

---

## 클래스

```typescript
class User {
  public name: string;
  private _password: string;

  private _hashPassword(password: string): string { ... }
  public getName(): string { ... }
}

// 커스텀 Error는 Error 접미사
class ValidationError extends Error { ... }
```

---

## 폴더 · 파일

- **폴더**: 복수형 (`components/`, `hooks/`, `services/`, `utils/`, `types/`, `constants/`)
- **파일**: `[name].[type].ts(x)` (kebab-case name)

```
user.service.ts
user.controller.ts
user.module.ts
create-user.dto.ts
user.type.ts
user.constants.ts
string.utils.ts
use-auth.hook.ts
user.component.tsx
user.spec.ts
```

---

## NestJS

```typescript
// user.service.ts / user.controller.ts / user.module.ts
@Injectable()
export class UserService {
  async getUser(id: number): Promise<User> { ... }
  async createUser(dto: CreateUserDTO): Promise<User> { ... }
  private _hashPassword(password: string): string { ... }
}

@Controller('users')
export class UserController { ... }

@Module({ controllers: [UserController], providers: [UserService] })
export class UserModule {}

// DTO: CreateUserDTO, UpdateUserDTO
// 파일: create-user.dto.ts, update-user.dto.ts
```

---

## DO / DON'T

### DO ✅
- camelCase / PascalCase / UPPER_SNAKE_CASE 구분
- Boolean: `is`/`has`/`can`/`did`/`should`
- 배열: 복수형 또는 `xxxList`
- 함수: 동사 시작, CRUD는 get/create/update/delete
- 파일: `[name].[type].ts(x)`, 폴더: 복수형
- Private: `_` 접두사 / Hook: `use` / 핸들러: `handle`

### DON'T ❌
- snake_case 변수, Interface/Enum에 `I` 접두사
- 폴더 단수형, 파일에 type 표기 생략
- 한글·영문 혼용, 과도한 약자 (`msg`, `usr`, `ctx`)
- 모호한 이름 (`data`, `value`, `item`)

---

## 핵심 요약

1. 변수·함수 camelCase / 타입·클래스 PascalCase / 상수 UPPER_SNAKE_CASE  
2. Boolean은 is/has/can, CRUD는 get/create/update/delete  
3. 파일은 `user.service.ts` 형태, 폴더는 복수형  
4. Private는 `_`, Hook은 `use`, 핸들러는 `handle`
