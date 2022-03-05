import {applyDecorators} from '@nestjs/common';
import {has as _has} from 'lodash';
import {Column, getMetadataArgsStorage} from 'typeorm';
import {EventListenerTypes} from 'typeorm/metadata/types/EventListenerTypes';
import {BaseField, IBaseFieldOptions} from './BaseField';
import {normalizeDateTime} from './DateTimeField';

export interface ICreateTimeFieldOptions extends IBaseFieldOptions {
    precision?: number,
}

const CreateTimeBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__createTimeBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            this[propertyName] = normalizeDateTime(new Date());
        };
    }

    getMetadataArgsStorage().entityListeners.push({
        target: object.constructor,
        propertyName: methodName,
        type: EventListenerTypes.BEFORE_INSERT,
    });
};

export function CreateTimeField(options: ICreateTimeFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Создан';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'CreateTimeField',
            appType: 'createTime',
            jsType: 'string',
        }),
        Column({
            type: 'timestamp',
            precision: _has(options, 'precision') ? options.precision : 0,
            default: _has(options, 'defaultValue') ? options.defaultValue : undefined,
            nullable: _has(options, 'nullable') ? options.nullable : false,
            transformer: {
                from: normalizeDateTime,
                to: normalizeDateTime,
            },
        }),
        CreateTimeBehaviour,
    );
}
