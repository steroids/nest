import {applyDecorators} from '@nestjs/common';
import {BaseField, getFieldOptions, getMetaPrimaryKey, IBaseFieldOptions} from './BaseField';
import {getTableFromModel} from '../TableFromModel';
import {Transform, TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';
import {DataMapper} from '../../../usecases/helpers/DataMapper';

export interface IRelationIdFieldOptions extends IBaseFieldOptions {
    relationName?: string,
}

// From db
const relationTransformFromDbInternal = (TableClass, value, isArray = false) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => relationTransformFromDbInternal(TableClass, item));
    }
    if (value && typeof value === 'object') {
        const primaryKey = getMetaPrimaryKey(TableClass);
        return value[primaryKey];
    }
    return value;
}
export const relationTransformFromDb = ({value, item, key, options}) => {
    if (value) {
        return value;
    }

    const relationOptions = getFieldOptions(item.constructor, options.relationName);
    const TableClass = getTableFromModel(relationOptions.relationClass());
    const relationValue = item[options.relationName];

    return relationTransformFromDbInternal(TableClass, relationValue, relationOptions.isArray);
}


// To db
const relationTransformToDbInternal = (TableClass, value, isArray = false) => {
    if (isArray && Array.isArray(value)) {
        return value.map(item => relationTransformToDbInternal(TableClass, item));
    }
    if (typeof value === 'number') {
        const primaryKey = getMetaPrimaryKey(TableClass);
        return DataMapper.create(TableClass, {[primaryKey]: value});
    }
    return value;
}
export const relationTransformToDb = ({value, item, options}) => {
    // Nothing do, see RelationField relationTransformToDb method for found *Ids logic
    return value;
}

export const relationTransform = ({value, options}) => {
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
            Transform(relationTransformFromDb, TRANSFORM_TYPE_FROM_DB),
            Transform(relationTransformToDb, TRANSFORM_TYPE_TO_DB),
        ].filter(Boolean)
    );
}
