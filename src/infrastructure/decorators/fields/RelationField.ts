import {applyDecorators} from '@nestjs/common';
import {ValidateIf, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, getFieldOptions, getMetaFields, getMetaPrimaryKey, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {DataMapper} from '../../../usecases/helpers/DataMapper';
import {getTableFromModel} from '../../base/ModelTableStorage';

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

const PROPERTY_TMP_ID_ENTITY = '__tmpIdEntity';

export const getMetaRelationIdFieldKey = (relationClass, relationName): string => {
    return getMetaFields(relationClass)
        .find(idName => {
            const idOptions = getFieldOptions(relationClass, idName);
            return idOptions.appType === 'relationId' && idOptions.relationName === relationName;
        });
}

const transformInstances = (TargetClass, value, isArray, transformType) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => transformInstances(TargetClass, item, false, transformType));
    }
    if (value && typeof value === 'object' && !(value instanceof TargetClass)) {
        return DataMapper.create(TargetClass, value, transformType);
    }
    return value;
};
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
};

export const relationTransformFromDb = ({value, object, key, options, transformType}) => {
    const ModelClass = options.relationClass();

    return transformInstances(ModelClass, value, options.isArray, transformType);
};

export const relationTransformToDb = ({value, item, key, options, transformType}) => {
    const TableClass = getTableFromModel(options.relationClass());

    return transformInstances(TableClass, value, options.isArray, transformType);
};

export const relationTransform = ({value, options, transformType}) => {
    const DtoClass = options.relationClass();
    return transformInstances(DtoClass, value, options.isArray, transformType);
};

export function RelationField(options: IRelationFieldOptions) {
    if (!options.transform) {
        options.transform = relationTransform;
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
            //options.type === 'ManyToOne' && JoinColumn(),
            ValidateIf((object, value) => !!value),
            ValidateNested({each: true}),
            Type(options.relationClass),
            Transform(relationTransformFromDb, TRANSFORM_TYPE_FROM_DB),
            Transform(relationTransformToDb, TRANSFORM_TYPE_TO_DB),
        ].filter(Boolean),
    );
}
