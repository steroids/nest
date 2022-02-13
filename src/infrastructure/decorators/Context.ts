import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {ContextDto} from '../../usecases/dtos/ContextDto';

export const Context = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        const contextDto = new ContextDto();
        contextDto.user = request.user;
        return contextDto;
    },
);
