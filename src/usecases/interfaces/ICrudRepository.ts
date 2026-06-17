import {DeepPartial} from '@steroidsjs/typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import SearchQuery, {ISearchQueryConfig} from '../base/SearchQuery';
import {ICondition} from '../../infrastructure/helpers/typeORM/ConditionHelperTypeORM';

export type TransactionHandler<TModel> = (callback: () => Promise<TModel>) => Promise<TModel>;

export interface ICrudRepository<TModel> {
    search: <TItem>(dto: SearchInputDto, searchQuery: SearchQuery<TModel>) => Promise<SearchResultDto<TModel | TItem>>,
    findOne: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel | null>,
    findMany: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel[]>,
    create: (model: TModel, transactionHandler?: TransactionHandler<TModel>) => Promise<TModel>,
    createQuery: (config?: ISearchQueryConfig<TModel>) => SearchQuery<TModel>,
    remove: (id: number, transactionHandler?: (callback) => Promise<void>) => Promise<void>,
    save(
        model: TModel,
        transactionHandler?: TransactionHandler<TModel | DeepPartial<TModel>>,
    ): Promise<TModel>,
    save(
        model: DeepPartial<TModel>,
        transactionHandler?: TransactionHandler<TModel | DeepPartial<TModel>>,
    ): Promise<DeepPartial<TModel>>,
    softRemove: (id: number, transactionHandler?: (callback: () => Promise<void>) => Promise<void>) => Promise<void>,
    update: (
        id: number,
        model: DeepPartial<TModel>,
        transactionHandler?: TransactionHandler<TModel | DeepPartial<TModel>>,
    ) => Promise<DeepPartial<TModel>>,
    isExistsById: (id: number) => Promise<boolean>,
}
