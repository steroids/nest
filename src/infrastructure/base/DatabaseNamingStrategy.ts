import {snakeCase} from 'typeorm/util/StringUtils';
import {DefaultNamingStrategy} from 'typeorm';

export class DatabaseNamingStrategy extends DefaultNamingStrategy {

    joinTableName(firstTableName: string,
                  secondTableName: string,
                  firstPropertyName: string,
                  secondPropertyName: string): string {
        return snakeCase(firstTableName + '_' + secondTableName);
    }
}
