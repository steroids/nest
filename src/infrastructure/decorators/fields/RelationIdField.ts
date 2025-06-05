import {applyDecorators} from '@nestjs/common';
import {isBoolean as _isBoolean} from 'lodash';
import {BaseField, getFieldOptions, getMetaPrimaryKey, IBaseFieldOptions} from './BaseField';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {getTableFromModel} from '../../base/ModelTableStorage';

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
};
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
};

export const relationTransformToDb = ({value}) =>
    // Nothing do, see RelationField relationTransformToDb method for found *Ids logic
    value;

export const relationTransform = ({value}) => value;

export function RelationIdField(options: IRelationIdFieldOptions = {}) {
    if (!options.transform) {
        options.transform = relationTransform;
    }
    if (!_isBoolean(options.nullable)) {
        options.nullable = true;
    }

    return applyDecorators(
        ...[
            BaseField(options, {
                decoratorName: 'RelationIdField',
                appType: 'relationId',
                jsType: 'number',
            }),
            Transform(relationTransformFromDb, TRANSFORM_TYPE_FROM_DB),
            Transform(relationTransformToDb, TRANSFORM_TYPE_TO_DB),
        ].filter(Boolean),
    );
}
