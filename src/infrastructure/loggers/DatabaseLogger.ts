import {Logger as TypeOrmLogger, QueryRunner} from '@steroidsjs/typeorm';
import {Logger as NestLogger} from '@nestjs/common';

export class DatabaseLogger implements TypeOrmLogger {
    private readonly logger = new NestLogger('Database');

    logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
        this.logger.debug({query: this.normalizeQuery(query), parameters}, 'SQL query');
    }

    logQueryError(error: string | Error, query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
        this.logger.error({query: this.normalizeQuery(query), parameters, error}, 'SQL query error');
    }

    logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner): any {
        this.logger.warn({query: this.normalizeQuery(query), parameters, time}, 'SQL query slow');
    }

    logMigration(message: string, _queryRunner?: QueryRunner): any {
        this.logger.debug(message);
    }

    logSchemaBuild(message: string, _queryRunner?: QueryRunner): any {
        this.logger.debug(message);
    }

    log(level: 'log' | 'info' | 'warn', message: string, _queryRunner?: QueryRunner): any {
        switch (level) {
            case 'log':
            case 'info':
                this.logger.log(message);
                break;
            case 'warn':
                this.logger.warn(message);
                break;
            default:
                break;
        }
    }

    private normalizeQuery(query: string) {
        return query.replace(/\s\s+/g, ' ').trim();
    }
}
