import {snakeCase} from 'typeorm-steroids/util/StringUtils';
import {DefaultNamingStrategy} from 'typeorm-steroids';

export class DatabaseNamingStrategy extends DefaultNamingStrategy {

    joinTableName(firstTableName: string,
                  secondTableName: string,
                  firstPropertyName: string,
                  secondPropertyName: string): string {
        return snakeCase(firstTableName + '_' + secondTableName);
    }
}
