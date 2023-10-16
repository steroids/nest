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
    ipAddress: string,
    language?: string;
}
