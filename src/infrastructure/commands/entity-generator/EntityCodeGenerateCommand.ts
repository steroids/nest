import {Command, Positional} from 'nestjs-command';
import {Injectable} from '@nestjs/common';
import {EntityCodeGenerator} from './EntityCodeGenerator';


@Injectable()
export class EntityCodeGenerateCommand {
    /**
     * Example:
     * yarn cli entity:generate entity module
     */
    @Command({
        command: 'entity:generate <entityName> <moduleName> [onlyReadService]',
        describe: 'Generate code for entity (model, repository, dtos and so on...)',
    })
    async index(
        @Positional({
            name: 'entityName',
            describe: 'A name of entity to generate',
            type: 'string',
        })
            entityName: string,
        @Positional({
            name: 'moduleName',
            describe: 'A module to put the code in',
            type: 'string',
        })
            moduleName: string,
        @Positional({
            name: 'onlyReadService',
            describe: 'Generate only read service entities',
            type: 'boolean',
        })
        onlyReadService?: boolean,
    ) {
        if (!entityName || !moduleName) {
            throw new Error('Required parameters are not provided');
        }

        (new EntityCodeGenerator(
            entityName,
            moduleName,
            null,
            onlyReadService,
        )).generate();
    }
}
