export interface ISaveManager<TModel>{
    save: (model) => Promise<TModel>,
}
