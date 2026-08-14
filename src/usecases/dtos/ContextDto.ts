export interface IContextDto {
    user?: any | {
        id?: number,
        name?: string,
        permissions?: string[],
    },
}

export class ContextDto implements IContextDto {
    // TODO Use AuthUserDto
    user?: any | {
        id?: number,
        name?: string,
        permissions?: string[],
    };

    ipAddress: string;

    userAgent?: string;

    language?: string;

    loginUid?: string;
}
