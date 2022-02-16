import {Entity} from 'typeorm';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';
import {ExtendField} from './fields/ExtendField';
import {applyDecorators} from '@nestjs/common';
import {getMetaFields} from './fields/BaseField';

export interface ITableOptions {
    name: string,
    label?: string,
    modelClass?: any,
}

function TableFromModelInternal(ModelClass) {
    return (target) => {
        getMetaFields(ModelClass).forEach(field => {
            ExtendField(ModelClass)(target.prototype, field);
        });
    };
}

export function TableFromModel(ModelClass, tableName) {
    return applyDecorators(
        Entity(tableName),
        TableFromModelInternal(ModelClass),
    );
}

