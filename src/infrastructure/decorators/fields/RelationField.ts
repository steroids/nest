import {applyDecorators} from '@nestjs/common';
import {ManyToMany, ManyToOne, OneToMany, OneToOne, JoinTable, JoinColumn} from 'typeorm';
import {ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IRelationFieldOptions extends IBaseFieldOptions {
    type: 'OneToOne' | 'ManyToMany' | 'ManyToOne' | 'OneToMany',
    inverseSide?: string | ((object: any) => any),
    //relationOptions?: RelationOptions,
    isOwningSide?: boolean,
    modelClass: any,
}

export function RelationField(options: IRelationFieldOptions) {

    const getRelationDecorator = (relation) => {
        switch (relation) {
            case 'OneToOne':
                return OneToOne;
            case 'ManyToMany':
                return ManyToMany;
            case 'OneToMany':
                return OneToMany;
            case 'ManyToOne':
                return ManyToOne;
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

    return applyDecorators(
        BaseField({
            ...options,
            decoratorName: 'RelationField',
            appType: 'integer',
        }),
        getRelationDecorator(options.type)
            (
                options.modelClass().name.replace(/Model$/, 'Table'),
                options.inverseSide,
                {cascade: true, onUpdate: 'CASCADE', onDelete: 'RESTRICT'}
            ),
        getOwningDecorator(options.type, options.isOwningSide)(),
        ValidateNested({each: true}),
        Type(options.modelClass),
    );
}
