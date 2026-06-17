import {DeepPartial} from '@steroidsjs/typeorm';

export interface ISaveManager<TModel> {
    save: (model: TModel | DeepPartial<TModel>) => Promise<TModel | DeepPartial<TModel>>,
}
