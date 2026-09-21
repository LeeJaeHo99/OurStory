# NestJS Service

서비스는 비즈니스 로직을 담당하고, 데이터베이스와 상호작용합니다.  
에러는 [`error-handling.md`](../shared/error-handling.md)에 따라 **Nest 내장 Exception + 메시지만** throw합니다.

---

## 기본 구조 · DI · CRUD

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customUserRepository: UserRepository, // 커스텀 리포지토리
    private readonly emailService: EmailService,           // 다른 Service
    private readonly configService: ConfigService,         // Config
  ) {}

  async getUserList(
    page = 1,
    limit = 10,
  ): Promise<{ items: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async getUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async hasUser(email: string): Promise<boolean> {
    return !!(await this.getUserByEmail(email));
  }

  async createUser(dto: CreateUserDTO): Promise<User> {
    this.logger.debug(`Creating user - email: ${dto.email}`);

    if (await this.getUserByEmail(dto.email)) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const maxUsers = this.configService.get('MAX_USERS');
    if ((await this.userRepository.count()) >= maxUsers) {
      throw new BadRequestException('사용자 수 제한을 초과했습니다.');
    }

    const user = this.userRepository.create(dto);
    user.password = await this._hashPassword(dto.password);
    const saved = await this.userRepository.save(user);

    await this.emailService.sendWelcomeEmail(saved.email);
    this.logger.log(`User created successfully - id: ${saved.id}`);
    return saved;
  }

  async updateUser(id: number, dto: UpdateUserDTO): Promise<User> {
    const user = await this.getUser(id);

    if (dto.email && dto.email !== user.email) {
      if (await this.getUserByEmail(dto.email)) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }
    }

    Object.assign(user, dto);
    const updated = await this.userRepository.save(user);
    this.logger.log(`User updated - id: ${id}`);
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.getUser(id);
    await this.postRepository.deleteMany({ userId: id }); // 관련 데이터 정리
    await this.userRepository.remove(user);
    this.logger.log(`User deleted - id: ${id}`);
  }

  // soft delete (주로 사용)
  async softDeleteUser(id: number): Promise<void> {
    const user = await this.getUser(id);
    user.deletedAt = new Date();
    await this.userRepository.save(user);
  }

  private async _hashPassword(password: string): Promise<string> {
    return password; // 실제로는 bcrypt 등 사용
  }
}
```

메서드명: `get` / `create` / `update` / `delete` (또는 softDelete).

---

## 트랜잭션

```typescript
async transferBalance(fromUserId: number, toUserId: number, amount: number): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const fromUser = await queryRunner.manager.findOne(User, { where: { id: fromUserId } });
    const toUser = await queryRunner.manager.findOne(User, { where: { id: toUserId } });

    if (fromUser.balance < amount) {
      throw new BadRequestException('잔액이 부족합니다.');
    }

    fromUser.balance -= amount;
    toUser.balance += amount;
    await queryRunner.manager.save(fromUser);
    await queryRunner.manager.save(toUser);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

## 데이터 변환 & 필터링

```typescript
async getUserPublicProfile(id: number) {
  const user = await this.getUser(id);
  const { password, ...publicUser } = user;
  return publicUser;
}

async getUserWithPosts(id: number) {
  const user = await this.userRepository.findOne({
    where: { id },
    relations: ['posts'],
  });
  if (!user) {
    throw new NotFoundException('사용자를 찾을 수 없습니다.');
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    postCount: user.posts.length,
    posts: user.posts.map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt,
    })),
  };
}
```

---

## 에러 처리 · 로깅

```typescript
async createUser(dto: CreateUserDTO): Promise<User> {
  try {
    if (await this.getUserByEmail(dto.email)) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
    return this.userRepository.save(this.userRepository.create(dto));
  } catch (error) {
    if (error instanceof HttpException) throw error;

    this.logger.error(`Failed to create user: ${error.message}`, {
      email: dto.email,
      stack: error.stack,
    });
    throw new InternalServerErrorException('사용자 생성에 실패했습니다.');
  }
}
```

| 상황 | Exception |
|------|-----------|
| 없음 | `NotFoundException` |
| 중복 | `ConflictException` |
| 비즈니스 규칙 위반 | `BadRequestException` |
| 서버 오류 | `InternalServerErrorException` |

- 커스텀 에러 코드 / `BusinessException` 사용 금지
- 중요 작업: `Logger` (`debug` / `log` / `warn` / `error`)

---

## 핵심 규칙

### DO ✅
- 비즈니스 로직만 담당
- Repository / Service / ConfigService DI
- CRUD: get / create / update / delete
- Nest 내장 Exception + 한국어 메시지, 중요 작업은 로깅
- 관련 작업은 트랜잭션, 반환 타입 명시

### DON'T ❌
- 컨트롤러 역할(라우팅·요청 파싱)
- DB 직접 쿼리(리포지토리 우회), 하드코딩
- `BusinessException` / 에러 코드 (`DB_001` 등)
- 에러 무시 후 `null` 반환
- 타입 생략, 로깅 없이 실패 처리

---

## 핵심 요약

1. Service = 비즈니스 로직 + Repository 사용  
2. CRUD 네이밍, DI로 의존성 주입  
3. Nest 내장 Exception + Logger ([error-handling.md](../shared/error-handling.md))  
4. 다중 쓰기 작업은 QueryRunner 트랜잭션
