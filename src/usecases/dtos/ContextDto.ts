export interface IContextDto {
    user?: any | {
        id?: number,
    },
}

export class ContextDto implements IContextDto{
    user?: any;
}
