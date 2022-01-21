
export class SearchResultDto<T> {
    total?: number;

    meta?: any;

    items: T[];
}
