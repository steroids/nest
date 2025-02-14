import {Entity} from '@steroidsjs/typeorm';
import {applyDecorators} from '@nestjs/common';
import {getFieldDecoratorName, getFieldOptions, getMetaFields} from '../fields/BaseField';
import {DecoratorFieldName, IAllFieldOptions} from '../fields';
import {typeOrmDecoratorFactory} from './TypeOrmDecoratorFactory';
import {setTableFromModel} from '../../base/ModelTableStorage';

export interface ITableOptions {
    name: string,
    label?: string,
    modelClass?: any,
}

function TypeOrmTableFromModelInternal(ModelClass: any) {
    return (target: any) => {
        setTableFromModel(ModelClass, target);

        getMetaFields(ModelClass).forEach(field => {
            // считаем что поле модели полем таблицы, если для него задан декоратор,
            // так как все steroids-поля задают декораторы
            // @todo нужно определять является ли поле колонкой в бд более семантически логичным способом
            const options: IAllFieldOptions = getFieldOptions(ModelClass, field);
            const decoratorName = getFieldDecoratorName(ModelClass, field) as DecoratorFieldName;
            const isTableColumn = !!decoratorName;

            if (isTableColumn && options && !options.noColumn) {
                typeOrmDecoratorFactory(decoratorName, options)?.forEach(decorator => decorator(target.prototype, field));
            }
        });
    };
}

export function TypeOrmTableFromModel(ModelClass, tableName) {
    return applyDecorators(
        Entity(tableName),
        TypeOrmTableFromModelInternal(ModelClass),
    );
}
