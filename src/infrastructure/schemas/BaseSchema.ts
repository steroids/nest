import {SearchSchema} from './SearchSchema';

export default class BaseSchema<Model> {
    constructor() {
        // TODO object assign model field with the same names
    }

    static createFromModel(model: any) {
        const schema = new this();
        return schema;
    }

    static createFromSearch<Model>(searchResult: SearchSchema<Model>): SearchSchema<BaseSchema<Model>> {
        const result: SearchSchema<BaseSchema<Model>> = {total: null, items: []};
        result.total = searchResult.total;
        result.meta = searchResult.meta;
        result.items = searchResult.items.map(model => BaseSchema.createFromModel(model));
        return result;
    }
}
