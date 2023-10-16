import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as requestIp from '@supercharge/request-ip';
import {ContextDto} from '../../usecases/dtos/ContextDto';

export const Context = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        const contextDto = new ContextDto();
        contextDto.user = request.user;
        contextDto.ipAddress = requestIp.getClientIp(request);
        return contextDto;
    },
);
