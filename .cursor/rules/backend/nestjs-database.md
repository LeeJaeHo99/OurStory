# NestJS Database (TypeORM)

NestJS와 TypeORM을 이용한 데이터베이스 관리입니다.  
커스텀 Repository 클래스는 만들지 않고, `@InjectRepository`로 TypeORM `Repository`를 사용합니다.

DB는 **PostgreSQL 15** 고정입니다. Docker는 `postgres:15` — [`devops-docker.md`](../devops/devops-docker.md).  
Redis 인프라는 [`nestjs-redis.md`](./nestjs-redis.md), 캐싱 전략은 [`nestjs-caching.md`](./nestjs-caching.md).

런타임 설정은 `ConfigService` 권장 — [`nestjs-config-management.md`](./nestjs-config-management.md).

---

## TypeORM 설정

```typescript
// database/data-source.ts
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres', // PostgreSQL 15
  host: process.env.DB_HOST || 'localhost', // compose app: postgres
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'myapp',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development', // 개발만
  logging: process.env.NODE_ENV === 'development',
};

export const dataSource = new DataSource(dataSourceOptions);
```

```typescript
// app.module.ts
TypeOrmModule.forRoot(dataSourceOptions)
```

프로덕션에서는 `synchronize: true` 금지. 스키마 변경은 마이그레이션으로만.

---

## 엔티티

```typescript
// user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @OneToMany(() => Post, (post) => post.author, { cascade: true })
  posts: Post[];

  @ManyToMany(() => Team, (team) => team.members)
  teams: Team[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}

// post.entity.ts — ManyToOne + FK
@ManyToOne(() => User, (user) => user.posts)
author: User;

@Column()
authorId: number;

// comment — 부모 삭제 시 cascade
@ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
post: Post;

// team — JoinTable은 owning side에
@ManyToMany(() => User, (user) => user.teams, { cascade: true })
@JoinTable({ name: 'user_teams' })
members: User[];
```

- 엔티티는 `entities/`에만
- 컬럼 타입 명시, 관계는 **양쪽**에 정의
- 엔티티에 비즈니스 로직 넣지 않기
- 조회·조인에 쓰는 컬럼/FK에는 인덱스 검토 (아래)

---

## 인덱스

검색·정렬·조인에 자주 쓰이는 컬럼에 인덱스를 둡니다.  
스키마 반영은 **마이그레이션**으로 합니다 (`synchronize`에만 의존하지 않음).

```typescript
import { Entity, Column, Index, ManyToOne } from 'typeorm';

@Entity('users')
@Index('IDX_USERS_EMAIL', ['email'], { unique: true }) // 단일·유니크
@Index('IDX_USERS_CREATED_AT', ['createdAt']) // 정렬/필터
@Index('IDX_USERS_ROLE_CREATED', ['role', 'createdAt']) // 복합 (WHERE + ORDER)
export class User {
  // 컬럼 단위 인덱스
  @Index('IDX_USERS_NAME')
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  // unique: true 는 유니크 인덱스와 동일 효과 (둘 중 하나로)
  // @Column({ unique: true }) email: string;
}

@Entity('posts')
@Index('IDX_POSTS_AUTHOR_ID', ['authorId']) // FK — 조인/목록 조회
export class Post {
  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Column()
  authorId: number;
}
```

| 상황 | 권장 |
|------|------|
| 이메일·슬러그 등 유니크 조회 | `@Index(..., { unique: true })` 또는 `@Column({ unique: true })` |
| `WHERE` / `ORDER BY` 자주 쓰는 컬럼 | 단일 `@Index` |
| 조건+정렬이 같이 반복 | 복합 인덱스 (왼쪽 컬럼 순서 중요) |
| FK (`authorId` 등) | FK 컬럼 인덱스 (조인·자식 목록) |

### DO
- 실제 쿼리 패턴에 맞춰 인덱스 추가
- 이름: `IDX_<TABLE>_<COLUMNS>` (유니크는 `UQ_` 가능)
- 인덱스 추가/변경은 마이그레이션

### DON'T
- 거의 안 쓰는 컬럼·저선택도(boolean만 등)에 남발
- write-heavy 테이블에 과도한 복합 인덱스
- 프로덕션에서 인덱스만 `synchronize`로 맞춤

관계·Eager/Lazy와 함께 보는 내용은 [`nestjs-typeorm-advanced.md`](./nestjs-typeorm-advanced.md).

---

## 마이그레이션

```bash
npm run migration:generate -- -n AddUserTable
npx typeorm migration:create src/database/migrations/AddUserTable
npm run migration:run
npm run migration:revert
npx typeorm migration:show
```

```typescript
export class CreateUserTable1000000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'password', type: 'varchar', length: '255' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()', onUpdate: 'now()' },
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

## Repository 사용 (`@InjectRepository`)

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['posts', 'comments'],
    });
  }

  async findAll(page: number, limit: number): Promise<[User[], number]> {
    return this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
```

```typescript
// module
TypeOrmModule.forFeature([User])
```

---

## QueryBuilder

복잡한 조건·조인·집계에 사용합니다. Raw Query는 남용하지 않습니다.

```typescript
async searchUsers(searchTerm: string, role: string): Promise<User[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .where('user.name ILIKE :search OR user.email ILIKE :search', {
      search: `%${searchTerm}%`,
    })
    .andWhere('user.role = :role', { role })
    .andWhere('user.status = :status', { status: 'ACTIVE' })
    .orderBy('user.createdAt', 'DESC')
    .getMany();
}

async getUsersWithPosts(): Promise<User[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.posts', 'post')
    .leftJoinAndSelect('post.comments', 'comment')
    .orderBy('user.createdAt', 'DESC')
    .getMany();
}

async getPaginatedUsers(page: number, limit: number) {
  const [items, total] = await this.userRepository
    .createQueryBuilder('user')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();
  return { items, total };
}

async countActiveUsers(): Promise<number> {
  return this.userRepository
    .createQueryBuilder('user')
    .where('user.status = :status', { status: 'ACTIVE' })
    .getCount();
}
```

---

## 시드

```typescript
// user.seed.ts
async function seed() {
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);

  if ((await userRepository.count()) > 0) {
    console.log('Database already seeded');
    return;
  }

  await userRepository.save([
    userRepository.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed_password',
      role: 'ADMIN',
    }),
    userRepository.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'hashed_password',
      role: 'USER',
    }),
  ]);

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
```

```bash
npm run seed
```

---

## 핵심 규칙

### DO ✅
- PostgreSQL 15 (`postgres:15`), 엔티티는 `entities/`에만, 컬럼 타입 명시
- 관계는 양쪽에 정의, FK에 `onDelete` 필요 시 설정
- 조회·FK 컬럼에 `@Index` / 복합·유니크 인덱스
- 스키마·인덱스 변경은 마이그레이션
- `@InjectRepository` + TypeORM `Repository`
- 복잡한 조회는 QueryBuilder
- Docker 사용 시 `DB_HOST` = `postgres`(컨테이너) / `localhost`(호스트)

### DON'T ❌
- 커스텀 Repository 클래스 작성
- 프로덕션 `synchronize: true`
- 엔티티에 비즈니스 로직
- 관계를 한쪽에만 정의
- 마이그레이션 없이 스키마·인덱스 변경
- 불필요한 인덱스 남발
- Raw Query 남용, N+1성 다중 조회
- Postgres major 버전을 15 외로 임의 변경

---

## 핵심 요약

1. PostgreSQL 15 + `TypeOrmModule.forRoot` + `forFeature([Entity])`  
2. 엔티티 + `@Index` + 마이그레이션으로 스키마 관리  
3. Service에서 `@InjectRepository`만 사용 (커스텀 Repo 금지)  
4. 복잡 쿼리는 QueryBuilder · 로컬 DB는 Docker `postgres:15`
