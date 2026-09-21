# NestJS JWT Authentication

JWT 기반 인증 시스템 구현입니다.

---

## 설치 · 환경 변수

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
# 비밀번호 해싱
npm install bcrypt
npm install --save-dev @types/bcrypt
```

```
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=604800
```

---

## AuthModule

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

---

## Strategies

```typescript
// jwt.strategy.ts — Bearer 토큰
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}

// local.strategy.ts — email/password
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
```

---

## AuthService

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;
    if (!(await bcrypt.compare(password, user.password))) return null;
    return user;
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existing) throw new UnauthorizedException('User already exists');

    const user = this.usersRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: await bcrypt.hash(registerDto.password, 10),
    });
    await this.usersRepository.save(user);
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.generateTokens(user);
  }

  generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException('User not found');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

---

## DTO · Controller

```typescript
export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(6) password: string;
  @IsString() @MinLength(6) passwordConfirm: string;
}

export class RefreshDto {
  @IsString() refreshToken: string;
}
```

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return req.user;
  }
}
```

---

## Guard 사용 · User Entity

```typescript
// 컨트롤러 전체 보호
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController { ... }

// 라우트별
@Get('public') getPublicData() { ... }

@Get('protected')
@UseGuards(AuthGuard('jwt'))
getProtectedData() { ... }
```

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() name: string;
  @Column() password: string;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

---

## 핵심 규칙

### DO ✅
- bcrypt 해싱 (최소 10 rounds)
- Access + Refresh Token
- 비밀번호 최소 길이 검증
- 시크릿은 환경 변수, JWT 검증 필수
- 에러 메시지 명확히

### DON'T ❌
- 평문 비밀번호 저장 / 로깅 / 이메일 전송
- 하드코딩 시크릿, 만료 무시, 토큰 재사용

### 체크리스트
- [ ] bcrypt ≥ 10 rounds  
- [ ] 강한 JWT 시크릿  
- [ ] Refresh Token  
- [ ] HTTPS / CORS / Rate Limiting  
- [ ] 민감 정보 로깅 금지  

---

## 핵심 요약

1. `JwtModule` + `JwtStrategy` / `LocalStrategy`  
2. register / login / refresh / me  
3. `@UseGuards(AuthGuard('jwt'))`로 보호  
4. bcrypt + env 시크릿 + Refresh Token
