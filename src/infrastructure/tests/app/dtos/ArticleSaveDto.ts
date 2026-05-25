import {ExtendField} from '../../../decorators/fields';
import {ArticleModel} from '../models/ArticleModel';
import {TagSaveDto} from './TagSaveDto';

export class ArticleSaveDto {
    @ExtendField(ArticleModel)
    id: number;

    @ExtendField(ArticleModel)
    title: string;

    @ExtendField(ArticleModel)
    text: string;

    @ExtendField(ArticleModel)
    tags: TagSaveDto[];

    @ExtendField(ArticleModel)
    creatorUserId: number;
}
