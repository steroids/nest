export interface IContextDto {
    user?: any | {
        id?: number,
        name?: string,
        permissions?: string[],
    },
}

export class ContextDto implements IContextDto {
    user?: any | { // TODO Use AuthUserDto
        id?: number,
        name?: string,
        permissions?: string[],
    };
    ipAddress: string;
    userAgent?: string;
    language?: string;
    loginUid?: string;
}
