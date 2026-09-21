import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiBody, ApiOperation } from '@nestjs/swagger';

export function ApiCommon<T, U>(summary: string, body?: T, res?: U) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiBody({
            schema: {
                example: body,
            },
        }),
        ApiOkResponse({
            schema: {
                example: {
                    isSuccess: true,
                    data: res,
                    message: '요청이 성공적으로 처리되었습니다.',
                },
            },
        }),
    );
}

export function ApiCommonBodyNone(summary: string) {
    return applyDecorators(
        ApiOperation({ summary }),
        ApiOkResponse({
            schema: {
                example: {
                    isSuccess: true,
                    data: null,
                    message: '요청이 성공적으로 처리되었습니다.',
                },
            },
        }),
    );
}