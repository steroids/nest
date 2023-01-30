export interface IType<T = any> extends Function {
    new (...args: any[]): T;
}
