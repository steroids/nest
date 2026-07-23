import {Column} from 'typeorm';
import {IRelationIdFieldOptions} from '../../../fields/RelationIdField';

export default (options: IRelationIdFieldOptions) => [
    !options.isArray && Column({
        type: 'int',
        nullable: options.nullable,
    }),
].filter(Boolean);
