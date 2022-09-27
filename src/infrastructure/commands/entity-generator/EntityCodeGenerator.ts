import * as fs from 'node:fs';
import * as path from 'path';
import {escapeRegExp} from 'lodash';

const ENTITY_NAME_PLACEHOLDER = '%entityName%';

const resultPaths = {
    model: 'domain/models/%entityName%Model.ts',
    repository: 'infrastructure/repositories/%entityName%Repository.ts',
    repositoryInterface: 'domain/interfaces/I%entityName%Repository.ts',
    table: 'infrastructure/tables/%entityName%Table.ts',
    service: 'domain/services/%entityName%Service.ts',
    saveDto: 'domain/dtos/%entityName%SaveDto.ts',
    searchDto: 'domain/dtos/%entityName%SearchDto.ts',
}

const templates = {
    model: 'ModelTemplate.txt',
    repository: 'RepositoryTemplate.txt',
    repositoryInterface: 'RepositoryInterfaceTemplate.txt',
    table: 'TableTemplate.txt',
    service: 'ServiceTemplate.txt',
    saveDto: 'SaveDtoTemplate.txt',
    searchDto: 'SearchDtoTemplate.txt',
}

export class EntityCodeGenerator {
    readonly entityName: string;
    readonly moduleName: string;
    readonly projectRootPath: string
    readonly modulePath: string;

    constructor(
        entityName: string,
        moduleName: string,
        rootPath: string = null,
    ) {
        // set first letter in upper case if it's not
        if (entityName[0].toUpperCase() !== entityName[0]) {
            this.entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
        } else {
            this.entityName = entityName;
        }

        this.moduleName = moduleName;
        this.projectRootPath = rootPath || process.cwd();
        this.modulePath = this.findModulePath(moduleName);
    }

    public generate() {
        const allFileTypes = Object.keys(templates);

        for (const fileType of allFileTypes) {
            this.generateFileByType(fileType);
        }
    }

    private generateFileByType(fileType) {
        const templatePath = path.resolve(__dirname, 'templates');

        let templateContent = fs.readFileSync(
            path.resolve(templatePath, templates[fileType]),
            'utf8',
        );

        const resultFileContent = templateContent.replace(
            new RegExp(`${escapeRegExp(ENTITY_NAME_PLACEHOLDER)}`, 'g'),
            this.entityName,
        );

        let resultFilePath = path.resolve(
            this.modulePath,
            resultPaths[fileType].replace(
                ENTITY_NAME_PLACEHOLDER,
                this.entityName,
            ),
        );

        const resultFileDirPath = path.dirname(resultFilePath);
        if (!fs.existsSync(resultFileDirPath)){
            fs.mkdirSync(resultFileDirPath, {recursive: true});
        }

        fs.writeFileSync(
            resultFilePath,
            resultFileContent,
        );
    }

    private findModulePath(moduleName) {
        let possibleModulePaths = [
            path.resolve(this.projectRootPath, 'src', moduleName),
            path.resolve(this.projectRootPath, moduleName),
        ]

        for (const path of possibleModulePaths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }

        throw new Error('No module with a provided name is found');
    }
}
