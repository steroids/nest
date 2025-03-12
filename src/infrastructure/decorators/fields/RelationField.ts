import {applyDecorators} from '@nestjs/common';
import {ManyToMany, ManyToOne, OneToMany, OneToOne, JoinTable, JoinColumn} from '@steroidsjs/typeorm';
import {ValidateIf, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, getFieldOptions, getMetaFields, getMetaPrimaryKey, IBaseFieldOptions} from './BaseField';
import {getTableFromModel} from '../TableFromModel';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {DataMapper} from '../../../usecases/helpers/DataMapper';

export interface IRelationFieldOneToOneOptions extends IBaseFieldOptions {
    type: 'OneToOne',
    isOwningSide: boolean,
    relationClass: () => any,
    inverseSide?: string | ((object: any) => any),
}

export interface IRelationFieldManyToManyOptions extends IBaseFieldOptions {
    type: 'ManyToMany',
    isOwningSide: boolean,
    relationClass: () => any,
    inverseSide?: string | ((object: any) => any),
    tableName?: string,
}

export interface IRelationFieldManyToOneOptions extends IBaseFieldOptions {
    type: 'ManyToOne',
    relationClass: () => any,
}

export interface IRelationFieldOneToManyOptions extends IBaseFieldOptions {
    type: 'OneToMany',
    relationClass: () => any,
    inverseSide: string | ((object: any) => any),
}

export type IRelationFieldOptions = IRelationFieldOneToOneOptions | IRelationFieldManyToManyOptions
    | IRelationFieldManyToOneOptions | IRelationFieldOneToManyOptions;

const getRelationDecorator = (relation): any => {
    switch (relation) {
        case 'OneToOne':
            return OneToOne;
        case 'ManyToMany':
            return ManyToMany;
        case 'OneToMany':
            return OneToMany;
        case 'ManyToOne':
            return ManyToOne;
        default:
            throw new Error('Wrong relation type: ' + relation);
    }
}

export const getMetaRelationIdFieldKey = (relationClass, relationName): string => {
    return getMetaFields(relationClass).find(idName => {
        const idOptions = getFieldOptions(relationClass, idName);
        return idOptions.appType === 'relationId' && idOptions.relationName === relationName;
    });
};

const getOwningDecorator = (options: IRelationFieldOneToOneOptions | IRelationFieldManyToManyOptions) => {
    if (options.type === 'ManyToMany' && options.isOwningSide) {
        return JoinTable;
    }
    if (options.type === 'OneToOne' && options.isOwningSide) {
        return JoinColumn;
    }
    return null;
}

const transformInstances = (TargetClass, value, isArray, transformType) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => transformInstances(TargetClass, item, false, transformType));
    }
    if (value && typeof value === 'object' && !(value instanceof TargetClass)) {
        return DataMapper.create(TargetClass, value, transformType);
    }
    return value;
}
const transformIds = (TableClass, value, isArray, transformType) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => transformIds(TableClass, item, false, transformType));
    }
    if (typeof value === 'number') {
        const primaryKey = getMetaPrimaryKey(TableClass);
        const entity = new TableClass();
        entity[primaryKey] = value;
        return entity;
    }
    return value;
}

export const relationTransformFromDb = ({value, object, key, options, transformType}) => {
    const ModelClass = options.relationClass();

    return transformInstances(ModelClass, value, options.isArray, transformType);
}

export const relationTransformToDb = ({value, item, key, options, transformType}) => {
    const TableClass = getTableFromModel(options.relationClass());

    return transformInstances(TableClass, value, options.isArray, transformType);
}

export const relationTransform = ({value, options, transformType}) => {
    const DtoClass = options.relationClass();
    return transformInstances(DtoClass, value, options.isArray, transformType);
}

export function RelationField(options: IRelationFieldOptions) {
    const OwningDecorator = getOwningDecorator(options as any);

    if (!options.transform) {
        options.transform = relationTransform;
    }

    let owningDecoratorOptions;
    if ('tableName' in options) {
        owningDecoratorOptions = {
            name: options.tableName,
        }
    }

    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'RelationField',
                appType: 'relation',
                jsType: 'number',
                swaggerType: options.relationClass(),
                isArray: ['ManyToMany', 'OneToMany'].includes(options.type),
            }),
            getRelationDecorator(options.type)(
                () => getTableFromModel(options.relationClass()),
                (options as any).inverseSide,
                {cascade: ['insert', 'update'], onUpdate: 'CASCADE'}
            ),
            OwningDecorator && OwningDecorator(owningDecoratorOptions),
            //options.type === 'ManyToOne' && JoinColumn(),
            ValidateIf((object, value) => !!value),
            ValidateNested({each: true}),
            Type(options.relationClass),
            Transform(relationTransformFromDb, TRANSFORM_TYPE_FROM_DB),
            Transform(relationTransformToDb, TRANSFORM_TYPE_TO_DB),
        ].filter(Boolean)
    );
}
