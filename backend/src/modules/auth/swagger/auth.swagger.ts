import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiBody, ApiOperation } from '@nestjs/swagger';

export function ApiRefreshToken() {
    return applyDecorators(
        ApiOperation({ summary: 'Token 재발급' }),
        ApiBody({
            schema: {
                example: {
                    refreshToken: '3f8a1c9e0b7d...',
                },
            },
        }),
        ApiOkResponse({
            schema: {
                example: {
                    isSuccess: true,
                    data: {
                        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
                        refreshToken: '9d2b4f7a1e6c...',
                    },
                    message: '요청이 성공적으로 처리되었습니다.',
                },
            },
        }),
    );
}

export function ApiLogout() {
    return applyDecorators(
        ApiOperation({ summary: '로그아웃' }),
        ApiBody({
            schema: {
                example: {
                    refreshToken: '3f8a1c9e0b7d...',
                },
            },
        }),
        ApiOkResponse({
            schema: {
                example: {
                    isSuccess: true,
                    data: null,
                    message: '로그아웃되었습니다.',
                },
            },
        }),
    );
}