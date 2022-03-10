import {ExtendField} from '../../../decorators/fields/ExtendField';
import {ArticleModel} from '../models/ArticleModel';
import {TagModel} from '../models/TagModel';
import {StringField} from '../../../decorators/fields';
import {Computable} from '../../../decorators/Computable';
import {UserSchema} from './UserSchema';

export class ArticleSchema {
    @ExtendField(ArticleModel)
    id: number;

    @ExtendField(ArticleModel, {
        transform: ({value}) => (value || '').toUpperCase(),
    })
    title: string;

    @StringField()
    @Computable(({item}) => (item.title || '').substr(0, 5))
    shortTitle: string;

    @ExtendField(ArticleModel)
    text: string;

    @ExtendField(ArticleModel)
    createTime: Date;

    @ExtendField(ArticleModel)
    tags: TagModel[];

    @ExtendField(ArticleModel, {
        relationClass: () => UserSchema,
    })
    creatorUser: UserSchema;
}
