import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const body = exception.getResponse();

        const message =
            typeof body === 'string'
                ? body
                : (body as { message?: string | string[] }).message;

        res.status(status).json({
            isSuccess: false,
            data: null,
            message: message,
        });
    }
}
