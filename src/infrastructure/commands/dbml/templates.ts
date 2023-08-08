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
    isNullable,
) {
    return [
        `    @${decoratorName}({`,
        `        label: '${fieldLabel}',`,
        isNullable && `        nullable: true,`,
        '    })',
        `    ${fieldName}: ${fieldJsType};`,
    ].filter(Boolean).join('\n');
}

export function templateModelRelation(
    fieldLabel,
    relationType,
    isOwningSide,
    modelRightName,
    fieldName,
    baseRightName,
    inverseSideFieldName,
    isNullable
) {
    const lines = [
        '    @RelationField({',
        `        label: '${fieldLabel}',`,
        `        type: '${relationType}',`,
        isOwningSide !== null && `        isOwningSide: ${isOwningSide},`,
        `        relationClass: () => ${modelRightName},`,
        inverseSideFieldName && `        inverseSide: (${baseRightName}: ${modelRightName}) => ${baseRightName}.${inverseSideFieldName},`,
        '    })',
        `    ${fieldName}: ${modelRightName}${relationType.endsWith('Many') ? '[]' : ''};`,
    ].filter(Boolean);

    if (relationType === 'ManyToOne') {
        lines.push(...[
            '\n    @RelationIdField({',
            `        label: '${fieldLabel}',`,
            isNullable && `        nullable: true,`,
            `        relationName: '${fieldName}',`,
            '    })',
            `    ${fieldName}Id: number;`,
        ].filter(Boolean));
    }

    return lines.join('\n')
}

export function templateTable(
    modelName,
    entityName,
    tableName,
) {
    return `import {TableFromModel} from '@steroidsjs/nest/infrastructure/decorators/TableFromModel';
import {IDeepPartial} from '@steroidsjs/nest/usecases/interfaces/IDeepPartial';
import {${modelName}} from '../../domain/models/${modelName}';

@TableFromModel(${modelName}, '${entityName}')
export class ${tableName} implements IDeepPartial<${modelName}> {}
`;
}
