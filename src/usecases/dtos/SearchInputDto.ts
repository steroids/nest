import {ApiProperty} from '@nestjs/swagger';

export interface ISearchInputDto {
    page?: number,
    pageSize?: number,
    sort?: string | string[],
}

export class SearchInputDto {
    @ApiProperty({required: false})
    page?: number;

    @ApiProperty({required: false})
    pageSize?: number;

    @ApiProperty({required: false})
    sort?: string | string[];
}
