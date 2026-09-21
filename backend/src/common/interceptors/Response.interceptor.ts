import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Result } from '../dto/Result.dto.js';
import { RESPONSE_MESSAGE_KEY } from '../decorators/ResponseMessage.decorator.js';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Result<T>> {
    constructor(private readonly reflector: Reflector) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Result<T>> {
        const req = context.switchToHttp().getRequest();

        if (req.url?.includes('/notifications/listen')) {
            return next.handle();
        }

        const message =
            this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? '요청이 성공적으로 처리되었습니다.';

        return next.handle().pipe(
            map((data) => ({
                isSuccess: true,
                data: data ?? null,
                message,
            })),
        );
    }
}
