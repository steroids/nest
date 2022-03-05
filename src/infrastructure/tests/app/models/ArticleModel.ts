import {
    RelationField,
    PrimaryKeyField,
    StringField,
    CreateTimeField,
    UpdateTimeField,
    RelationIdField} from '../../../decorators/fields';
import {UserModel} from './UserModel';
import {TagModel} from './TagModel';
import {CommentModel} from './CommentModel';

export class ArticleModel {
    @PrimaryKeyField()
    id: number;

    @StringField()
    title: string;

    @StringField({
        nullable: true,
    })
    text: string;

    @CreateTimeField()
    createTime: Date;

    @UpdateTimeField()
    updateTime: Date;

    @RelationIdField({
        relationName: 'tags',
        isArray: true,
    })
    tagIds: number[];

    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => TagModel,
    })
    tags: TagModel[];

    @RelationIdField({
        relationName: 'creatorUser',
    })
    creatorUserId: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => UserModel,
        nullable: true,
    })
    creatorUser: UserModel;

    @RelationField({
        type: 'OneToMany',
        inverseSide: comment => comment.article,
        relationClass: () => CommentModel,
    })
    comments: CommentModel[];
}
