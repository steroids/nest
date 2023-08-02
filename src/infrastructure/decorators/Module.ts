import {camelCase as _camelCase} from 'lodash';
import {Global, Module as NestModule, ModuleMetadata} from '@nestjs/common';
import {TypeOrmModule} from '@steroidsjs/nest-typeorm';
import {ModuleHelper} from '../helpers/ModuleHelper';
import {PermissionsFactory} from '../helpers/PermissionsFactory';

export interface IModule extends ModuleMetadata {
    name?: string;
    rootTarget?: any;
    global?: boolean;
    config?: () => any,
    module?: (config: any) => ModuleMetadata,
    tables?: Function[];
    permissions?: any,
}

export function Module(data: IModule) {
    return (target) => {
        // Custom module class
        if (data.rootTarget) {
            target = data.rootTarget;
        }

        if (!data.name) {
            data.name = _camelCase(target.name).replace(/Module$/, '');
        }

        // Store entities for use it in TypeOrm root module
        if (data.tables) {
            ModuleHelper.addEntities(data.tables, data.name);
        }

        // Lazy call nest module decorator (wait config initialize)
        if (data.module) {
            ModuleHelper.addInitializer(() => {
                const nestConfig = data.module(ModuleHelper.getConfig(target));
                nestConfig.imports = (nestConfig.imports || []).concat(TypeOrmModule.forFeature(data.tables));
                NestModule(nestConfig)(target);
            });
        }

        // Use global nest decorator
        if (data.global) {
            Global()(target);
        }

        // Add module permissions
        if (data.permissions) {
            PermissionsFactory.add(data.permissions);
        }

        // Store module config for global use via ModuleHelper
        if (data.config) {
            ModuleHelper.setConfig(target, data.config);
        }

        return target;
    };
}
