import {Entity} from 'typeorm';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {ExtendField} from './fields/ExtendField';
import {applyDecorators} from '@nestjs/common';
import {getMetaFields} from './fields/BaseField';

export interface ITableOptions {
    name: string,
    label?: string,
    modelClass?: any,
}

const modelToTableMap = {};

export const getTableFromModel = (ModelClass) => {
    return modelToTableMap[ModelClass.name] || null;
}

function TableFromModelInternal(ModelClass) {
    return (target) => {
        modelToTableMap[ModelClass.name] = target;

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

