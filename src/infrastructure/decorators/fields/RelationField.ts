import {applyDecorators} from '@nestjs/common';
import {ManyToMany, ManyToOne, OneToMany, OneToOne, JoinTable, JoinColumn} from 'typeorm';
import {ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IRelationFieldOptions extends IBaseFieldOptions {
    type: 'OneToOne' | 'ManyToMany' | 'ManyToOne' | 'OneToMany',
    inverseSide?: string | ((object: any) => any),
    isOwningSide?: boolean,
    modelClass: any,
}

const getRelationDecorator = (relation): any => {
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
}

const getOwningDecorator = (relation, owningSide) => {
    if (relation === 'ManyToMany' && owningSide) {
        return JoinTable;
    }
    if (relation === 'OneToOne' && owningSide) {
        return JoinColumn;
    }
    return null;
}

export function RelationField(options: IRelationFieldOptions) {
    const OwningDecorator = getOwningDecorator(options.type, options.isOwningSide);

    return applyDecorators(
        ...[
            BaseField({
                ...options,
                decoratorName: 'RelationField',
                appType: 'integer',
            }),
            getRelationDecorator(options.type)(
                () => options.modelClass().name.replace(/Model$/, 'Table'),
                options.inverseSide,
                {cascade: ['insert', 'update'], onUpdate: 'CASCADE'}
            ),
            OwningDecorator && OwningDecorator(),
            ValidateNested({each: true}),
            Type(options.modelClass),
        ].filter(Boolean)
    );
}
