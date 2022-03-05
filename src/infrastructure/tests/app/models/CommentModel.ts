import {
    CreateTimeField,
    PrimaryKeyField, RelationField, RelationIdField,
    StringField
} from '../../../decorators/fields';
import {ArticleModel} from './ArticleModel';
import {UserModel} from './UserModel';

export class CommentModel {
    @PrimaryKeyField()
    id: number;

    @StringField()
    message: string;

    @RelationIdField({
        relationName: 'article',
    })
    articleId: number;

    @RelationIdField({
        relationName: 'user',
    })
    userId: number;

    @CreateTimeField()
    createTime: Date;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => ArticleModel,
    })
    article: ArticleModel;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => UserModel,
        nullable: true,
    })
    user: UserModel;

}
