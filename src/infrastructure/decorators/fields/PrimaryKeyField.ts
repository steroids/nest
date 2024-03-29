import {applyDecorators} from '@nestjs/common';
import {PrimaryGeneratedColumn} from '@steroidsjs/typeorm';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function PrimaryKeyField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'ИД';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'PrimaryKeyField',
            appType: 'primaryKey',
            jsType: 'number',
        }),
        PrimaryGeneratedColumn({type: 'integer'}),
    );
}
