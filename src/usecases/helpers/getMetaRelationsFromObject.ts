import {getFieldAppType, getFieldOptions, isMetaClass} from '../../infrastructure/decorators/fields/BaseField';
import {IType} from '../interfaces/IType';

const joinRelationPath = (parentPath: string, fieldName: string): string => parentPath
    ? `${parentPath}.${fieldName}`
    : fieldName;

const isRecursiveRelationValue = (value: unknown): value is Record<string, any> => (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
);

const getNestedRelationValues = (value: unknown): Record<string, any>[] => {
    if (Array.isArray(value)) {
        return value.filter(isRecursiveRelationValue);
    }

    return isRecursiveRelationValue(value)
        ? [value]
        : [];
};

export const getMetaRelationsFromObject = (obj: Record<string, any>, ModelClass: IType) => {
    const relationNames = new Set<string>();

    const collectRelationNames = (
        currentObject: Record<string, any>,
        RelationMetaClass: IType,
        parentPath = '',
    ) => {
        Object.entries(currentObject).forEach(([fieldName, value]) => {
            const options = getFieldOptions(RelationMetaClass, fieldName);
            const appType = getFieldAppType(RelationMetaClass, fieldName);

            if (!options) {
                return;
            }

            if (appType === 'relationId' && options.relationName) {
                relationNames.add(joinRelationPath(parentPath, fieldName));
                return;
            }

            if (appType !== 'relation') {
                return;
            }

            const relationPath = joinRelationPath(parentPath, fieldName);
            relationNames.add(relationPath);

            if (!options.relationClass) {
                return;
            }

            const NestedMetaClass = options.relationClass();
            if (!isMetaClass(NestedMetaClass)) {
                return;
            }

            getNestedRelationValues(value).forEach(nestedValue => {
                collectRelationNames(nestedValue, NestedMetaClass, relationPath);
            });
        });
    };

    collectRelationNames(obj, ModelClass);

    return Array.from(relationNames);
};
