import {format} from '@sqltools/formatter';
import {Query} from 'typeorm/driver/Query';

const renderParameters = (parameters: any[] | undefined): string => {
    if (!parameters?.length) {
        return '';
    }

    return `, ${JSON.stringify(parameters)}`;
};

/**
 * Форматирует SQL для читаемой вставки в TypeScript-файл миграции.
 */
export const prettifyQuery = (query: string): string => {
    const formattedQuery = format(query, {indent: '    '});
    return '\n'
        + formattedQuery.replace(/^/gm, '            ')
            .replace(/`/g, '\\`')
        + '\n        ';
};

/**
 * Преобразует Query TypeORM в строку вызова queryRunner.query().
 */
export function renderQuery({query, parameters}: Query): string {
    return `        await queryRunner.query(\`${prettifyQuery(query)}\`${renderParameters(parameters)});`;
}

/**
 * Формирует содержимое TypeScript-файла миграции.
 */
export const getTemplate = (
    name: string,
    timestamp: number,
    upQueries: Query[],
    downQueries: Query[],
): string => {
    const migrationName = `${name}${timestamp}`;

    return `import type {MigrationInterface, QueryRunner} from 'typeorm';

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}';

    public async up(queryRunner: QueryRunner): Promise<void> {
${upQueries.map(renderQuery).join('\n')}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downQueries.map(renderQuery).join('\n')}
    }
}
`;
};
