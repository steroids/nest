export interface IType<T = any> {
    readonly name: string,
    readonly prototype: T,
    new (...args: any[]): T,
}
