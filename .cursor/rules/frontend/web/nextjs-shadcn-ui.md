# shadcn/ui Components

shadcn/ui로 UI를 구성합니다. 폼(Zod + RHF)은 [`nextjs-forms.md`](./nextjs-forms.md)를 따릅니다.

---

## 설치

```bash
npx shadcn@latest init
npx shadcn@latest add button input form card dialog tabs dropdown-menu toast
```

컴포넌트는 `components/ui/`에 생성되며, 필요 시 `className` / CVA `variant`로만 커스터마이징합니다.

---

## Button · Input

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// variant: default | destructive | outline | secondary | ghost | link
// size: default | sm | lg | icon
<Button variant="outline" size="sm">Save</Button>
<Button variant="destructive">Delete</Button>

// Label + Input + 에러
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" className={error ? 'border-red-500' : ''} />
  {error && <p className="text-sm text-red-500">{error}</p>}
</div>
```

---

## Form (shadcn Form + RHF)

스키마·`useForm`·`zodResolver`는 [`nextjs-forms.md`](./nextjs-forms.md). UI는 `FormField` 조합:

```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormDescription>We'll never share your email.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Role</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    <Button type="submit">Submit</Button>
  </form>
</Form>
```

---

## Dialog

```typescript
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Delete Item',
  description = 'This action cannot be undone.',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  title?: string
  description?: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogCancel>Cancel</DialogCancel>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dialog + Form
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <UserForm onSuccess={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

---

## Tabs

```typescript
<Tabs defaultValue="profile" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">{/* ... */}</TabsContent>
  <TabsContent value="security">{/* ... */}</TabsContent>
  <TabsContent value="notifications">{/* ... */}</TabsContent>
</Tabs>
```

---

## Dropdown Menu

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="h-8 w-8 p-0">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={onDelete} className="text-red-600">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Card

```typescript
<Card>
  <CardHeader>
    <CardTitle>{name}</CardTitle>
    <CardDescription>{email}</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm">
      Status:{' '}
      <span className={status === 'active' ? 'text-green-600' : 'text-gray-400'}>
        {status}
      </span>
    </p>
  </CardContent>
  <CardFooter>
    <Button variant="outline" onClick={onAction}>View Details</Button>
  </CardFooter>
</Card>
```

---

## Toast

```typescript
const { toast } = useToast()

try {
  await deleteUser(userId)
  toast({ title: 'Success', description: 'User deleted successfully' })
} catch {
  toast({
    title: 'Error',
    description: 'Failed to delete user',
    variant: 'destructive',
  })
}
```

---

## 규칙

### DO
- `variant` / `size`(CVA)로 스타일 관리
- 접근성·반응형 유지 (Radix 기반 컴포넌트 활용)
- `components/ui` 조합 + Tailwind `className`으로 커스터마이징
- 일관된 스페이싱 (`space-y-*`, gap)

### DON'T
- 인라인 스타일
- 디자인 토큰 밖 색상 임의 지정
- 접근성 무시 / ui 컴포넌트 과도한 포크
- UI 컴포넌트 안에 복잡한 비즈니스 상태 관리
