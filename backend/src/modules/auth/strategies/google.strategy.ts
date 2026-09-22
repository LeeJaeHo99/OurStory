import { Injectable } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Provider } from "../../users/enums/Provider.enum.js";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
    constructor(
        private readonly configService: ConfigService
    ){
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, name, emails } = profile;
        const email = emails?.[0]?.value;

        if(!name) {
            return done(new Error('구글 계정에서 이름 정보를 가져올 수 없습니다.'), false);
        }

        if(!email) {
            return done(new Error('구글 계정에서 이메일 정보를 가져올 수 없습니다.'), false);
        }

        const googleUser = {
            provider: Provider.GOOGLE,
            providerId: id,
            nickname: name.givenName,
            email,
        };

        done(null, googleUser);
    }
}