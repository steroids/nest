import {getOwningDecorator, getRelationDecorator} from './TypeOrmRelationBehaviour';
import {getTableFromModel} from '../../../../base/ModelTableStorage';
import {IRelationFieldOptions} from '../../../fields/RelationField';

export default (options: IRelationFieldOptions) => {
    const OwningDecorator = getOwningDecorator(options as any);
    let owningDecoratorOptions;
    if ('tableName' in options) {
        owningDecoratorOptions = {name: options.tableName};
    }
    return [
        getRelationDecorator(options.type)(
            () => getTableFromModel(options.relationClass()),
            (options as any).inverseSide,
            {cascade: ['insert', 'update'],
                onUpdate: 'CASCADE'},
        ),
        OwningDecorator && OwningDecorator(owningDecoratorOptions),
    ].filter(Boolean);
}
