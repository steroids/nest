import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {getMetadataArgsStorage, UpdateDateColumn} from 'typeorm';
import {EventListenerTypes} from 'typeorm/metadata/types/EventListenerTypes';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IUpdateTimeFieldOptions extends IBaseFieldOptions {
    precision?: number,
}

const UpdateTimeBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__updateTimeBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            this[propertyName] = new Date();
        };
    }

    [EventListenerTypes.BEFORE_INSERT, EventListenerTypes.BEFORE_INSERT].forEach(type => {
        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: methodName,
            type,
        });
    });
};

export function UpdateTimeField(options: IUpdateTimeFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Обновлен';
    }

    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'UpdateTimeField',
            appType: 'updateTime',
        }),
        UpdateDateColumn({
            type: 'timestamp',
            precision: _has(options, 'precision') ? options.precision : 0,
            default: _has(options, 'defaultValue') ? options.defaultValue : undefined,
            nullable: _has(options, 'nullable') ? options.nullable : false,
        }),
        UpdateTimeBehaviour,
        Type(() => Date),
    );
}
