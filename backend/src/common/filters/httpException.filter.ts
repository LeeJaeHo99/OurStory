import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = '서버 오류가 발생했습니다.';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();

            if (typeof body === 'string') {
                message = body;
            } else if (body && typeof body === 'object') {
                const raw = (body as { message?: string | string[] }).message;
                message = Array.isArray(raw) ? raw.join(', ') : raw || message;
            }
        }

        res.status(status).json({
            isSuccess: false,
            data: null,
            message,
        });
    }
}
