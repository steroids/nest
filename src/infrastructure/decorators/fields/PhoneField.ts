import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsPhoneNumber} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export function PhoneField(options: IBaseFieldOptions = {}) {
    if (!options.label) {
        options.label = 'Телефон';
    }

    return applyDecorators(
        BaseField(options, {
            decoratorName: 'PhoneField',
            appType: 'phone',
            jsType: 'string',
        }),
        Column({
            type: 'varchar',
            length: options.max || 16,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsPhoneNumber(),
    );
}
