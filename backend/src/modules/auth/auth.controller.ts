import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../users/entities/user.entity.js';
import { GoogleUserPayload } from './types/GoogleUserPayload.type.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleAuth(){}

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleLogin(
        @Req() req: Request & { user: GoogleUserPayload },
        @Res() res: Response,
    ){
        const user = (await this.authService.validateOAuthUser(req.user)) as User;

        const { accessToken, refreshToken } = await this.authService.login(user);
        
        const FRONTEND_URL = this.configService.get<string>('FRONTEND_URL');

        res.redirect(`${FRONTEND_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    }

    @Post('refresh')
    refreshToken(
        @Body('refreshToken') refreshToken: string
    ){
        return this.authService.refreshTokens(refreshToken);
    }

    @Post('logout')
    async logout(
        @Body('refreshToken') refreshToken: string
    ){
        await this.authService.logout(refreshToken);
        return { message: '로그아웃되었습니다.' };
    }
}