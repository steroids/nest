import {IAppModuleConfig} from '../IAppModuleConfig';

export interface IRestAppModuleConfig extends IAppModuleConfig {
    requestSizeLimit?: string,
    cors?: {
        allowDomains?: string[],
        allowMethods?: string[],
        allowHeaders?: string[],
    },
    gracefulEnabled?: boolean,
}
