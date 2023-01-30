import {IAppModuleConfig} from '../IAppModuleConfig';

export interface IRestAppModuleConfig extends IAppModuleConfig {
    cors?: {
        allowDomains?: string[],
        allowMethods?: string[],
        allowHeaders?: string[],
    },
}
