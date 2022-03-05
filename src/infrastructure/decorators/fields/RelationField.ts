import {applyDecorators} from '@nestjs/common';
import {ManyToMany, ManyToOne, OneToMany, OneToOne, JoinTable, JoinColumn} from 'typeorm';
import {ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, getFieldOptions, getMetaFields, getMetaPrimaryKey, IBaseFieldOptions} from './BaseField';
import {getTableFromModel} from '../TableFromModel';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {DataMapper} from '../../../usecases/helpers/DataMapper';

export interface IRelationFieldOneToOneOptions extends IBaseFieldOptions {
    type: 'OneToOne',
    isOwningSide: boolean,
    relationClass: () => any,
}

export interface IRelationFieldManyToManyOptions extends IBaseFieldOptions {
    type: 'ManyToMany',
    isOwningSide: boolean,
    relationClass: () => any,
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

const getOwningDecorator = (options: IRelationFieldOneToOneOptions | IRelationFieldManyToManyOptions) => {
    if (options.type === 'ManyToMany' && options.isOwningSide) {
        return JoinTable;
    }
    if (options.type === 'OneToOne' && options.isOwningSide) {
        return JoinColumn;
    }
    return null;
}

const transformInstances = (TargetClass, value, isArray = false) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => transformInstances(TargetClass, item));
    }
    if (typeof value === 'object' && !(value instanceof TargetClass)) {
        return DataMapper.create(TargetClass, value);
    }
    return value;
}
const transformIds = (TableClass, value, isArray = false) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => transformIds(TableClass, item));
    }
    if (typeof value === 'number') {
        const primaryKey = getMetaPrimaryKey(TableClass);
        return DataMapper.create(TableClass, {[primaryKey]: value});
    }
    return value;
}

export const relationTransformFromDb = ({value, options}) => {
    const ModelClass = options.relationClass();
    return transformInstances(ModelClass, value, options.isArray);
}

export const relationTransformToDb = ({value, item, key, options}) => {
    const TableClass = getTableFromModel(options.relationClass());

    const relationIdName = getMetaFields(item.constructor).find(name => {
        const relationOptions = getFieldOptions(item.constructor, name);
        return relationOptions.appType === 'relationId' && relationOptions.relationName === key;
    });

    if (relationIdName && item[relationIdName]) {
        return transformIds(TableClass, item[relationIdName], options.isArray)
    }

    return transformInstances(TableClass, value, options.isArray);
}

export const relationTransform = ({value, options}) => {
    const DtoClass = options.relationClass();
    return transformInstances(DtoClass, value, options.isArray);
}

export function RelationField(options: IRelationFieldOptions) {
    const OwningDecorator = getOwningDecorator(options as any);

    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'RelationField',
                appType: 'relation',
                jsType: 'number',
                isArray: ['ManyToMany', 'OneToMany'].includes(options.type),
            }),
            getRelationDecorator(options.type)(
                () => getTableFromModel(options.relationClass()),
                (options as any).inverseSide,
                {cascade: ['insert', 'update'], onUpdate: 'CASCADE'}
            ),
            OwningDecorator && OwningDecorator(),
            //options.type === 'ManyToOne' && JoinColumn(),
            ValidateNested({each: true}),
            Type(options.relationClass),
            Transform(relationTransformFromDb, TRANSFORM_TYPE_FROM_DB),
            Transform(relationTransformToDb, TRANSFORM_TYPE_TO_DB),
            Transform(options.transform || relationTransform),
        ].filter(Boolean)
    );
}
