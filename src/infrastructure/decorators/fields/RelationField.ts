import {applyDecorators} from '@nestjs/common';
import {Column} from 'typeorm';
import {IsInt} from 'class-validator';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IRelationFieldOptions extends IBaseFieldOptions {
    relationType?: 'hasOne' | 'hasMany',
    relationModel?: any,
}

export function RelationField(options: IRelationFieldOptions = {}) {
    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'RelationField',
            appType: 'integer',
        }),
        Column({
            type: 'integer',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
        IsInt(),
    );
}
