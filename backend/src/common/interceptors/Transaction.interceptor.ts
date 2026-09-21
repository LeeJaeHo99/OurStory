import { CallHandler, ExecutionContext, Injectable, InternalServerErrorException, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";
import { DataSource } from "typeorm";

@Injectable()
export class TransactionInterceptor implements NestInterceptor{
    constructor(
        private readonly dataSource: DataSource,
    ){}

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        const QR = this.dataSource.createQueryRunner();

        await QR.connect();
        await QR.startTransaction();

        req.queryRunner = QR;

        return next
                .handle()
                .pipe(
                    catchError(
                        async (e) => {
                            console.error(e);
                            
                            await QR.rollbackTransaction();
                            await QR.release();

                            throw new InternalServerErrorException('서버 에러가 발생하였습니다.');
                        }
                    ),
                    tap(async () => {
                        await QR.commitTransaction();
                        await QR.release();
                    })
                )
    }
}