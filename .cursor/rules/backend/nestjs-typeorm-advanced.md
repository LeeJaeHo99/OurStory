# TypeORM Advanced

TypeORM 고급 기법 및 최적화입니다.  
기본 설정·엔티티 기초는 [`nestjs-database.md`](./nestjs-database.md)를 참고하세요.

---

## 엔티티 관계

### One-to-Many / Many-to-One

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Post, (post) => post.author, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  posts: Post[];
}

@Entity('posts')
export class Post {
  @ManyToOne(() => User, (user) => user.posts, {
    eager: true,
    onDelete: 'CASCADE',
  })
  author: User;

  @Column()
  authorId: string;
}
```

### Many-to-Many

```typescript
@Entity('users')
export class User {
  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId' },
    inverseJoinColumn: { name: 'roleId' },
  })
  roles: Role[];
}

@Entity('roles')
export class Role {
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
```

---

## Repository 조회 · QueryBuilder

```typescript
// 관계 포함
find({ relations: ['posts', 'roles'], order: { createdAt: 'DESC' } });

// 페이지네이션
const [data, total] = await this.usersRepository.findAndCount({
  relations: ['posts'],
  order: { createdAt: 'DESC' },
  skip: (page - 1) * limit,
  take: limit,
});
return { data, total, page, limit, totalPages: Math.ceil(total / limit) };

// Like 검색
find({
  where: [{ email: Like(`%${keyword}%`) }, { name: Like(`%${keyword}%`) }],
});
```

```typescript
// Join + 조건
this.usersRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('user.isActive = :isActive', { isActive: true })
  .andWhere('post.publishedAt IS NOT NULL')
  .orderBy('user.createdAt', 'DESC')
  .addOrderBy('post.publishedAt', 'DESC')
  .take(10)
  .getMany();

// Count
.createQueryBuilder('user')
.where('user.isActive = :isActive', { isActive: true })
.getCount();

// 집계
.createQueryBuilder('user')
.leftJoin('user.posts', 'post')
.select('user.id', 'userId')
.addSelect('COUNT(post.id)', 'postCount')
.groupBy('user.id')
.getRawMany();

// 날짜 범위
.where('post.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
```

---

## 인덱스 · Eager / Lazy

엔티티 인덱스 기본(`@Index`, 복합·유니크·FK)은 [`nestjs-database.md`](./nestjs-database.md)의 **인덱스** 섹션을 따릅니다.

```typescript
@Entity('users')
@Index('IDX_USERS_EMAIL', ['email'], { unique: true })
@Index('IDX_USERS_CREATED_AT', ['createdAt'])
@Index('IDX_USERS_EMAIL_ACTIVE', ['email', 'isActive'])
export class User {
  // ...
}

// Eager: 항상 로드 / Lazy: 필요할 때만
@OneToMany(() => Post, (post) => post.author, { eager: true })
posts: Post[];

@OneToMany(() => Post, (post) => post.author, { eager: false, lazy: true })
posts: Promise<Post[]>;

const posts = await user.posts; // lazy 로드
```

---

## Hooks (Life Cycle)

```typescript
@BeforeInsert()
async hashPassword() {
  this.password = await bcrypt.hash(this.password, 10);
}

@BeforeUpdate()
async hashPasswordIfChanged() {
  if (this.passwordChanged) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordChanged = false;
  }
}

@AfterLoad()
async calculateFullName() {
  // 로드 후 추가 처리
}
```

---

## 트랜잭션

```typescript
async transferCredits(fromUserId: string, toUserId: string, amount: number) {
  const queryRunner = getConnection().createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const fromUser = await queryRunner.manager.findOne(User, fromUserId);
    const toUser = await queryRunner.manager.findOne(User, toUserId);

    fromUser.credits -= amount;
    toUser.credits += amount;

    await queryRunner.manager.save(fromUser);
    await queryRunner.manager.save(toUser);
    await queryRunner.commitTransaction();
    return { success: true };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

## 마이그레이션

```bash
npx typeorm migration:create -n CreateUsersTable
npx typeorm migration:run
npx typeorm migration:revert
```

```typescript
export class CreateUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'name', type: 'varchar' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

---

## 핵심 규칙

### DO ✅
- 관계 명확히, Eager vs Lazy 구분
- 필요한 인덱스만, 복잡 쿼리는 QueryBuilder
- 트랜잭션으로 일관성, 마이그레이션으로 스키마 관리

### DON'T ❌
- 모든 관계 Eager / Eager 남용
- N+1, 불필요한 인덱스, 순환 관계
- 트랜잭션 없는 다중 업데이트

---

## 핵심 요약

1. 관계 + `relations` / `leftJoinAndSelect`  
2. 페이지네이션·검색·집계는 QueryBuilder  
3. 인덱스·Eager/Lazy로 성능 조절  
4. Hooks / Transaction / Migration으로 일관성 유지
