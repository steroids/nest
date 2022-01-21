import {ApiProperty} from '@nestjs/swagger';
import {SearchResultDto} from '../../usecases/dtos/SearchResultDto';

export class SearchSchema<Model> {
    @ApiProperty()
    total?: number;

    @ApiProperty()
    meta?: any;

    @ApiProperty()
    items?: Model[];

    static createFromDto<M>(searchResult: SearchResultDto<M>): SearchSchema<M> {
        const result = new this<M>();
        result.items = searchResult.items;
        result.meta = searchResult.meta;
        result.total = searchResult.total;
        return result;
    }
}
