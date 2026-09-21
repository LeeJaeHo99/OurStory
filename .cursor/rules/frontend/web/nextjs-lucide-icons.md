# Lucide React Icons

Lucide React를 사용한 아이콘 활용입니다.

---

## 설치

```bash
npm install lucide-react
```

---

## 기본 사용

### 간단한 아이콘

```typescript
// src/components/IconExample.tsx
import {
  Home,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'

export function IconExample() {
  return (
    <div className="space-y-4">
      <Home size={24} />
      <Settings size={24} />
      <User size={24} />
      <LogOut size={24} />
      
      {/* 크기와 색상 커스터마이징 */}
      <AlertCircle size={32} className="text-yellow-500" />
      <CheckCircle size={32} className="text-green-500" />
      <XCircle size={32} className="text-red-500" />
    </div>
  )
}
```

---

## 버튼과 함께

### Icon Button

```typescript
// src/components/IconButton.tsx
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Share2 } from 'lucide-react'

export function IconButtons() {
  return (
    <div className="flex gap-2">
      {/* 아이콘만 */}
      <Button size="icon" variant="outline">
        <Plus size={18} />
      </Button>

      {/* 아이콘 + 텍스트 */}
      <Button>
        <Edit size={18} className="mr-2" />
        Edit
      </Button>

      {/* 텍스트 + 아이콘 */}
      <Button>
        Share
        <Share2 size={18} className="ml-2" />
      </Button>

      {/* 위험 작업 */}
      <Button variant="destructive" size="icon">
        <Trash2 size={18} />
      </Button>
    </div>
  )
}
```

---

## Navigation 메뉴

### Sidebar Navigation

```typescript
// src/components/Sidebar.tsx
import { useRouter } from 'next/navigation'
import {
  Home,
  Users,
  FileText,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export function Sidebar() {
  const router = useRouter()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
    { label: 'Users', href: '/users', icon: <Users size={20} /> },
    { label: 'Posts', href: '/posts', icon: <FileText size={20} /> },
    { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white p-6">
      <nav className="space-y-2">
        {navItems.map(item => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="w-full flex items-center gap-3 px-4 py-2 mt-8 rounded-lg hover:bg-red-600 transition">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
```

### Top Navigation

```typescript
// src/components/TopNav.tsx
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function TopNav() {
  const [isDark, setIsDark] = useState(false)

  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b">
      {/* 왼쪽 */}
      <div className="flex items-center gap-4">
        <Button size="icon" variant="ghost">
          <Menu size={20} />
        </Button>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300"
          />
        </div>
      </div>

      {/* 오른쪽 */}
      <div className="flex items-center gap-4">
        <Button size="icon" variant="ghost">
          <Bell size={20} />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
      </div>
    </nav>
  )
}
```

---

## 상태 표시 아이콘

### Status Indicators

```typescript
// src/components/StatusBadge.tsx
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'loading'
  text?: string
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    pending: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    loading: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50' },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
      <Icon
        size={18}
        className={`${config.color} ${status === 'loading' ? 'animate-spin' : ''}`}
      />
      <span className="text-sm font-medium">{text || status}</span>
    </div>
  )
}

// 사용
<StatusBadge status="success" text="Active" />
<StatusBadge status="loading" text="Processing" />
<StatusBadge status="error" text="Failed" />
```

---

## Table Actions

### Action Icons

```typescript
// src/components/UserTable.tsx
import {
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  id: string
  name: string
  email: string
}

export function UserTable({ users }: { users: User[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th>Name</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id} className="border-b">
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <Eye size={18} />
                </Button>
                <Button size="icon" variant="ghost">
                  <Edit size={18} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 size={18} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## Empty State

### Empty State Component

```typescript
// src/components/EmptyState.tsx
import { Inbox, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon = <Inbox size={48} />,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-gray-400">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      {actionLabel && (
        <Button onClick={onAction}>
          <Plus size={18} className="mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// 사용
<EmptyState
  title="No posts yet"
  description="Create your first post to get started"
  actionLabel="Create Post"
  onAction={() => router.push('/create-post')}
/>
```

---

## Loading Skeleton

### Skeleton with Icons

```typescript
// src/components/LoadingSkeleton.tsx
import { Loader2 } from 'lucide-react'

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// 로딩 스피너
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  )
}
```

---

## 커스텀 Icon Component

### Icon Wrapper

```typescript
// src/components/Icon.tsx
import * as Icons from 'lucide-react'
import { ComponentProps } from 'react'

type IconName = keyof typeof Icons

interface IconProps extends ComponentProps<'svg'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  const IconComponent = Icons[name] as React.FC<ComponentProps<'svg'>>

  if (!IconComponent) {
    return null
  }

  return <IconComponent size={size} {...props} />
}

// 사용
<Icon name="Home" size={24} className="text-blue-500" />
<Icon name="Settings" size={20} />
<Icon name="AlertCircle" size={32} className="text-red-500" />
```

---

## 핵심 규칙

### DO ✅
- 크기 일관성 유지
- Tailwind로 색상/호버 관리
- 시맨틱 아이콘 선택
- accessibility 고려
- 로딩 시 animate-spin
- 스트로크 일관성

### DON'T ❌
- 부적절한 아이콘 선택
- 인라인 색상 지정
- 크기 무작위 설정
- 의미 없는 아이콘
- 색상 너무 많음

---

## 자주 사용되는 아이콘

```typescript
// 네비게이션
Home, Settings, User, LogOut, Menu, X

// 상태
CheckCircle, AlertCircle, XCircle, Loader2, Clock

// 액션
Edit, Trash2, Copy, Download, Upload, Share2

// 정보
Info, HelpCircle, AlertTriangle, Eye, EyeOff

// 화살표
ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRight

// 검색/필터
Search, Filter, Sliders

// 차트/데이터
BarChart3, LineChart, PieChart, TrendingUp, TrendingDown
```

---

## AI 프롬프트 팁

Lucide 아이콘 사용할 때:
```
"Lucide React로 아이콘을 사용해줘:

1. 네비게이션 아이콘 (Home, Settings 등)
2. 상태 아이콘 (Check, Alert 등)
3. 액션 아이콘 (Edit, Delete 등)
4. 크기: 18-24 기본
5. Tailwind로 색상 관리
6. 로딩 시 animate-spin"
```