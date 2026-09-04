import {DeepPartial} from 'typeorm';

export interface ISaveManager<TModel> {
    save: (model: TModel | DeepPartial<TModel>) => Promise<TModel | DeepPartial<TModel>>,
}
