import {MetaHelper} from '../../infrastructure/helpers/MetaHelper';

export interface IQueryRelation {
    name: string,
    alias?: string,
    isId?: boolean,
}

export default class SteroidsQuery<TDto> {
    readonly dto?: TDto;
    readonly select?: string[];
    readonly excludeSelect?: string[];
    readonly relations?: IQueryRelation[];

    static create(dto = null, SchemaClass = null) {
        return new SteroidsQuery({
            dto,
            ...MetaHelper.getSchemaQueryData(SchemaClass),
        });
    }

    constructor(data: SteroidsQuery<TDto> = {}) {
        this.dto = data.dto;
        this.select = data.select;
        this.excludeSelect = data.excludeSelect;
        this.relations = data.relations;
    }
}
