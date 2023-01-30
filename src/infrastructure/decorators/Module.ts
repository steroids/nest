import {Global, Module as NestModule, ModuleMetadata} from '@nestjs/common';
import {TypeOrmModule} from '@steroidsjs/nest-typeorm';
import {ModuleHelper} from '../helpers/ModuleHelper';

export interface ModuleConfig extends ModuleMetadata {
    rootTarget?: any;
    global?: boolean;
    config?: () => any,
    module?: (config: any) => ModuleMetadata,
    entities?: Function[];
}

export function Module(config: ModuleConfig) {
    return (target) => {
        // Custom module class
        if (config.rootTarget) {
            target = config.rootTarget;
        }

        // Store entities for use it in TypeOrm root module
        if (config.entities) {
            ModuleHelper.addEntities(config.entities);
        }

        // Lazy call nest module decorator (wait config initialize)
        if (config.module) {
            ModuleHelper.addInitializer(() => {
                const nestConfig = config.module(ModuleHelper.getConfig(target));
                nestConfig.imports = (nestConfig.imports || []).concat(TypeOrmModule.forFeature(config.entities));
                NestModule(nestConfig)(target);
            });
        }

        // Use global nest decorator
        if (config.global) {
            Global()(target);
        }

        // Store module config for global use via ModuleHelper
        if (config.config) {
            ModuleHelper.setConfig(target, config.config);
        }

        return target;
    };
}
