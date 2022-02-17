import {applyDecorators} from '@nestjs/common';
import {v4 as uuidv4} from 'uuid';
import {Column, getMetadataArgsStorage} from 'typeorm';
import {EventListenerTypes} from 'typeorm/metadata/types/EventListenerTypes';
import {BaseField, IBaseFieldOptions} from './BaseField';

export const generateUid = (): string => uuidv4();

const UidBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__uidBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            if (!this[propertyName]) {
                this[propertyName] = generateUid();
            }
        };
    }

    getMetadataArgsStorage().entityListeners.push({
        target: object.constructor,
        propertyName: methodName,
        type: EventListenerTypes.BEFORE_INSERT,
    });
};

export function UidField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Уникальный код';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'UidField',
            appType: 'uid',
            jsType: 'string',
        }),
        Column({
            type: options.dbType || 'varchar',
            length: 36,
            default: null,
            update: false,
        }),
        UidBehaviour,
    );
}
