import * as fs from 'node:fs';
import * as path from 'path';
import {escapeRegExp, snakeCase} from 'lodash';

const ENTITY_NAME_PLACEHOLDER = '%entityName%';
const TABLE_NAME_PLACEHOLDER = '%tableName%';

const resultPaths = {
    model: 'domain/models/%entityName%Model.ts',
    repository: 'infrastructure/repositories/%entityName%Repository.ts',
    repositoryInterface: 'domain/interfaces/I%entityName%Repository.ts',
    table: 'infrastructure/tables/%entityName%Table.ts',
    crudService: 'domain/services/%entityName%Service.ts',
    readService: 'domain/services/%entityName%Service.ts',
    saveDto: 'domain/dtos/%entityName%SaveDto.ts',
    searchDto: 'domain/dtos/%entityName%SearchDto.ts',
};

const templates = {
    model: 'ModelTemplate.txt',
    repository: 'RepositoryTemplate.txt',
    repositoryInterface: 'RepositoryInterfaceTemplate.txt',
    table: 'TableTemplate.txt',
    readService: 'ReadServiceTemplate.txt',
    crudService: 'CrudServiceTemplate.txt',
    searchDto: 'SearchDtoTemplate.txt',
    saveDto: 'SaveDtoTemplate.txt',
};

export class EntityCodeGenerator {
    readonly entityName: string;

    readonly moduleName: string;

    readonly tableName: string;

    readonly projectRootPath: string;

    readonly modulePath: string;

    readonly onlyReadService: boolean;

    readonly placeholdersValuesMap: Record<string, string> = {};

    constructor(
        entityName: string,
        moduleName: string,
        rootPath: string = null,
        onlyReadService = false,
    ) {
        // set first letter in upper case if it's not
        if (entityName[0].toUpperCase() !== entityName[0]) {
            this.entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
        } else {
            this.entityName = entityName;
        }

        this.moduleName = moduleName;
        this.onlyReadService = onlyReadService;
        this.projectRootPath = rootPath || process.cwd();
        this.modulePath = this.findModulePath(moduleName);
        this.tableName = this.getTableName();

        this.placeholdersValuesMap = {
            [ENTITY_NAME_PLACEHOLDER]: this.entityName,
            [TABLE_NAME_PLACEHOLDER]: this.tableName,
        };
    }

    public generate() {
        const allFileTypes = Object.keys(templates);

        for (const fileType of allFileTypes) {
            if (this.shouldSkipTemplate(fileType)) {
                continue;
            }

            this.generateFileByType(fileType);
        }
    }

    private shouldSkipTemplate(fileType: string): boolean {
        const skipIfReadOnly = ['crudService', 'saveDto'];
        const skipIfNotReadOnly = ['readService'];

        if (this.onlyReadService) {
            return skipIfReadOnly.includes(fileType);
        }

        return skipIfNotReadOnly.includes(fileType);
    }

    private generateFileByType(fileType) {
        const templatePath = path.resolve(__dirname, 'templates');

        let resultFileContent = fs.readFileSync(
            path.resolve(templatePath, templates[fileType]),
            'utf8',
        );

        for (const placeholder in this.placeholdersValuesMap) {
            resultFileContent = resultFileContent.replace(
                new RegExp(`${escapeRegExp(placeholder)}`, 'g'),
                this.placeholdersValuesMap[placeholder],
            );
        }

        const resultFilePath = path.resolve(
            this.modulePath,
            resultPaths[fileType].replace(
                ENTITY_NAME_PLACEHOLDER,
                this.entityName,
            ),
        );

        const resultFileDirPath = path.dirname(resultFilePath);
        if (!fs.existsSync(resultFileDirPath)) {
            fs.mkdirSync(resultFileDirPath, {recursive: true});
        }

        if (fs.existsSync(resultFilePath)) {
            console.log(`File ${resultFilePath} already exists, skipping to avoid overwriting.`);
            return;
        }

        fs.writeFileSync(
            resultFilePath,
            resultFileContent,
        );
    }

    private findModulePath(moduleName) {
        const possibleModulePaths = [
            path.resolve(this.projectRootPath, 'src', moduleName),
            path.resolve(this.projectRootPath, moduleName),
        ];

        for (const path of possibleModulePaths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }

        throw new Error('No module with a provided name is found');
    }

    private getTableName() {
        let tableName = snakeCase(this.entityName);
        const isTableNameContainsModuleName = (
            new RegExp(`^${this.moduleName}.*`)
        ).test(tableName);

        console.log('check', this.entityName, this.moduleName, isTableNameContainsModuleName);

        if (!isTableNameContainsModuleName) {
            tableName = this.moduleName + '_' + tableName;
        }

        return tableName;
    }
}
