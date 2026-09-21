import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LogInterceptor implements NestInterceptor{
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const req = context.switchToHttp().getRequest();

        const path = req.originalUrl;
        const now = new Date();

        console.log('=====================================================');

        console.log(`[REQ] ${req.method} ${path} ${now.toLocaleString('kr')}`);

        return next
                .handle()
                .pipe(tap(observable => console.log(`[RES] ${req.method} ${path} ${now.toLocaleString('kr')}   < ${new Date().getMilliseconds() - now.getMilliseconds()}ms >`)))
                .pipe(tap(() => {
                    console.log('=====================================================');
                }));
    }
}