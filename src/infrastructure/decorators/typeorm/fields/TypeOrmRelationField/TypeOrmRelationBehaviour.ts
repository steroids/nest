import {JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne} from '@steroidsjs/typeorm';
import {IRelationFieldManyToManyOptions, IRelationFieldOneToOneOptions} from '../../../fields/RelationField';

export const getRelationDecorator = (relation): any => {
    switch (relation) {
        case 'OneToOne':
            return OneToOne;
        case 'ManyToMany':
            return ManyToMany;
        case 'OneToMany':
            return OneToMany;
        case 'ManyToOne':
            return ManyToOne;
        default:
            throw new Error('Wrong relation type: ' + relation);
    }
};

export const getOwningDecorator = (options: IRelationFieldOneToOneOptions | IRelationFieldManyToManyOptions) => {
    if (options.type === 'ManyToMany' && options.isOwningSide) {
        return JoinTable;
    }
    if (options.type === 'OneToOne' && options.isOwningSide) {
        return JoinColumn;
    }
    return null;
};
