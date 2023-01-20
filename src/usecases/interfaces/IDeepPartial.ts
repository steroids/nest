export type IDeepPartial<T> = T extends object ? {
    [P in keyof T]?: IDeepPartial<T[P]>;
} : T;
