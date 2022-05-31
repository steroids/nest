import {applyDecorators} from '@nestjs/common';
import {BaseField, getFieldOptions, getMetaPrimaryKey, IBaseFieldOptions} from './BaseField';
import {getTableFromModel} from '../TableFromModel';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {Column} from 'typeorm';
import {ArrayNotEmpty} from "class-validator";

export interface IRelationIdFieldOptions extends IBaseFieldOptions {
    relationName?: string,
    isFieldValidConstraintMessage?: string,
}

// From db
const relationTransformFromDbInternal = (TableClass, value, isArray, transformType) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => relationTransformFromDbInternal(TableClass, item, false, transformType));
    }
    if (value && typeof value === 'object') {
        const primaryKey = getMetaPrimaryKey(TableClass);
        return value[primaryKey];
    }
    return value;
}
export const relationTransformFromDb = ({value, item, options, transformType}) => {
    if (value) {
        return value;
    }

    const relationOptions = getFieldOptions(item.constructor, options.relationName);
    if (!relationOptions) {
        return value;
    }

    const TableClass = getTableFromModel(relationOptions.relationClass());
    if (!TableClass) {
        return value;
    }

    const relationValue = item[options.relationName];
    return relationTransformFromDbInternal(TableClass, relationValue, relationOptions.isArray, transformType);
}

export const relationTransformToDb = ({value}) => {
    // Nothing do, see RelationField relationTransformToDb method for found *Ids logic
    return value;
}

export const relationTransform = ({value}) => {
    return value;
}

export function RelationIdField(options: IRelationIdFieldOptions = {}) {
    if (!options.transform) {
        options.transform = relationTransform;
    }

    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'RelationIdField',
                appType: 'relationId',
                jsType: 'number',
            }),
            !options.isArray && Column({type: 'int', nullable: true}),
            !options.nullable && options.isArray && ArrayNotEmpty({message: options.isFieldValidConstraintMessage}),
            Transform(relationTransformFromDb, TRANSFORM_TYPE_FROM_DB),
            Transform(relationTransformToDb, TRANSFORM_TYPE_TO_DB),
        ].filter(Boolean)
    );
}
