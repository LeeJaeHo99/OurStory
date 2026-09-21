import { createParamDecorator, ExecutionContext, InternalServerErrorException,  } from "@nestjs/common";

export const QueryRunner = createParamDecorator(
    (data, context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();

        if(!req.queryRunner){
            throw new InternalServerErrorException('Transation Interseptor를 적용해야합니다.');
        }

        return req.queryRunner;
    }
);