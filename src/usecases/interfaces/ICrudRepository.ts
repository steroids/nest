import {Repository} from 'typeorm';
import {SearchResultDto} from '../dtos/SearchResultDto';
import {SearchInputDto} from '../dtos/SearchInputDto';
import {Type} from '@nestjs/common';
import SearchQuery from '../base/SearchQuery';
import {ICondition} from '../helpers/ConditionHelper';

export interface ICrudRepository<TModel> {
    dbRepository: Repository<any>;
    search: <TItem>(dto: SearchInputDto, searchQuery: SearchQuery<TModel>) => Promise<SearchResultDto<TModel | Type<TItem>>>,
    findOne: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel | null>,
    findMany: (conditionOrQuery: ICondition | SearchQuery<TModel>, eagerLoading?: boolean) => Promise<TModel[]>,
    create: (model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    update: (id: number, model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    save: (model: TModel, transactionHandler?: (callback) => Promise<void>) => Promise<TModel>,
    remove: (id: number, transactionHandler?: (callback) => Promise<void>) => Promise<void>,
}
