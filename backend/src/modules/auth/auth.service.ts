import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh_token.entity.js';
import { ConfigService } from '@nestjs/config';
import { GoogleUserPayload } from './types/GoogleUserPayload.type.js';
import { Role } from '../users/enums/Role.enum.js';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    // 로그인
    async login(user: User) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user);

        return { accessToken, refreshToken };
    }

    // 로그아웃
    async logout(rawRefreshToken: string){
        const tokenHash = this.hashToken(rawRefreshToken);

        await this.refreshTokenRepository.update({ tokenHash }, { revoked: true });
    }

    // 유저 로그인 시 검증 (신규 OR 기존 유저)
    async validateOAuthUser(user: GoogleUserPayload) {
        const existingUser = await this.userRepository.findOne({
            where: {
                provider: user.provider,
                providerId: user.providerId,
            },
        });

        if (existingUser) {
            return existingUser;
        }

        const nickname = await this.generateUniqueNickname(user.nickname);

        const newUser = this.userRepository.create({
            provider: user.provider,
            providerId: user.providerId,
            nickname,
            email: user.email,
            role: Role.USER,
            profileImgUrl: null,
        });

        return this.userRepository.save(newUser);
    }

    // 유일한 닉네임 생성
    async generateUniqueNickname(baseNickname: string) {
        let nickname = baseNickname;
        let suffix = 0;

        while (await this.userRepository.findOne({ where: { nickname } })) {
            suffix++;
            nickname = `${baseNickname}${suffix}`;
        }

        return nickname;
    }

    // Access Token 생성
    generateAccessToken(user: User){
        const payload = { sub: user.id, email: user.email };

        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<JwtSignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN') ?? '30m',
        });
    }

    // Refresh Token 생성
    async generateRefreshToken(user: User){
        const rawToken = randomBytes(64).toString('hex');
        const tokenHash = this.hashToken(rawToken);

        const expiresInDays = Number(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'));
        const expiresAt = new Date();

        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const refreshTokenEntity = this.refreshTokenRepository.create({
            userId: user.id,
            tokenHash,
            expiresAt,
            revoked: false,
        });

        await this.refreshTokenRepository.save(refreshTokenEntity);

        return rawToken;
    }

    // Token 재발급
    async refreshTokens(rawRefreshToken: string){
        const tokenHash = this.hashToken(rawRefreshToken);

        const storedToken = await this.refreshTokenRepository.findOne({
            where: { tokenHash },
            relations: { user: true },
        });

        if(!storedToken){
            throw new UnauthorizedException('유효하지 않은 Refresh Token입니다.');
        }

        if(storedToken.revoked){
            await this.revokeAllTokens(storedToken.userId);
            throw new UnauthorizedException('토큰 탈취 의심으로 재로그인이 필요합니다.');
        }

        if(storedToken.expiresAt < new Date()){
            throw new UnauthorizedException('만료된 Token입니다.');
        }

        storedToken.revoked = true;
        await this.refreshTokenRepository.save(storedToken);

        const accessToken = this.generateAccessToken(storedToken.user);
        const newRefreshToken = await this.generateRefreshToken(storedToken.user);

        return { accessToken, refreshToken: newRefreshToken };
    }

    // 토큰 만료 상태 true로 변경
    async revokeAllTokens(userId: string){
        await this.refreshTokenRepository.update({ userId }, { revoked: true });
    }

    // Refresh Token 해싱
    hashToken(rawToken: string){
        return createHash('sha256').update(rawToken).digest('hex');
    }
}
