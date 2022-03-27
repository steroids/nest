import {Entity} from 'typeorm';
import {ExtendField} from './fields/ExtendField';
import {applyDecorators} from '@nestjs/common';
import {getFieldDecoratorName, getMetaFields} from './fields/BaseField';

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
            // считаем что поле модели полем таблицы, если для него задан декоратор,
            // так как все steroids-поля задают декораторы
            // @todo нужно определять является ли поле колонкой в бд более семантически логичным способом
            const isTableColumn = !!getFieldDecoratorName(ModelClass, field);
            if (isTableColumn) {
                ExtendField(ModelClass)(target.prototype, field);
            }
        });

    };
}

export function TableFromModel(ModelClass, tableName) {
    return applyDecorators(
        Entity(tableName),
        TableFromModelInternal(ModelClass),
    );
}

