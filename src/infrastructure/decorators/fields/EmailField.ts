import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsEmail} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function EmailField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Email';
    }

    return applyDecorators(
        BaseField(options,{
            decoratorName: 'EmailField',
            appType: 'email',
            jsType: 'string',
        }),
        Column({
            type: 'varchar',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsEmail(),
    );
}
