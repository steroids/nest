import {
    uniq as _uniq,
} from 'lodash';

export function templateModel(
    importedFields,
    modulesImports,
    tableDescription,
    modelName,
    modelFieldCodes,
) {
    return `import {
${_uniq(importedFields).map(line => '    ' + line).join(',\n')},
} from '@steroidsjs/nest/infrastructure/decorators/fields';
${modulesImports}
/**
 * ${tableDescription}
 */
export class ${modelName} {
${modelFieldCodes.join('\n\n')}
}
`;
}

export function templateModelField(
    decoratorName,
    fieldLabel,
    fieldName,
    fieldJsType,
) {
    return `    @${decoratorName}({
        label: '${fieldLabel}',
    })
    ${fieldName}: ${fieldJsType};`;
}

export function templateModelRelation(
    fieldLabel,
    relationType,
    isOwningSide,
    modelRightName,
    fieldName,
) {
    return `    @RelationField({
        label: '${fieldLabel}',
        type: '${relationType}',
        isOwningSide: ${isOwningSide},
        relationClass: () => ${modelRightName},
    })
    ${fieldName}: ${modelRightName}${relationType.endsWith('Many') ? '[]' : ''};`;
}

export function templateTable(
    modelName,
    entityName,
    tableName,
) {
    return `import {TableFromModel} from '@steroidsjs/nest/infrastructure/decorators/TableFromModel';
import {DeepPartial} from '@steroidsjs/typeorm';
import {${modelName}} from '../../domain/models/${modelName}';

@TableFromModel(${modelName}, '${entityName}')
export class ${tableName} implements DeepPartial<${modelName}> {}
`;
}
