import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as requestIp from '@supercharge/request-ip';
import {ContextDto} from '../../usecases/dtos/ContextDto';
import {DataMapper} from '../../usecases/helpers/DataMapper';

export const Context = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        return DataMapper.create<ContextDto>(ContextDto, {
            user: request.user,
            ipAddress: requestIp.getClientIp(request),
            userAgent: request.headers['User-Agent'] || request.headers['user-agent'],
            loginUid: request.loginUid,
        });
    },
);
