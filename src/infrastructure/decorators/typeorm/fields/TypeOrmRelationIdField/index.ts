import {Column} from '@steroidsjs/typeorm';
import {IRelationIdFieldOptions} from '../../../fields/RelationIdField';

export default (options: IRelationIdFieldOptions) => [
    !options.isArray && Column({
        type: 'int',
        nullable: options.nullable,
    }),
].filter(Boolean);
