/**
 * Use for PinoLogger
 **/
export interface ILogger {
    setContext: (value: string) => void,
    warn: (msg: string, ...args: any[]) => void,
    info: (msg: string, ...args: any[]) => void,
    error: (msg: string, ...args: any[]) => void,
    debug: (msg: string, ...args: any[]) => void,
    fatal: (msg: string, ...args: any[]) => void,
    trace: (msg: string, ...args: any[]) => void,
}
