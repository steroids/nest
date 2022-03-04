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

    @StringField()
    text: string;

    @CreateTimeField()
    createTime: Date;

    @UpdateTimeField()
    updateTime: Date;

    @RelationIdField({
        relationName: 'tag',
        isArray: true,
    })
    tagIds: number[];

    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        modelClass: () => TagModel,
    })
    tags: TagModel[];

    @RelationIdField({
        relationName: 'creatorUser',
    })
    creatorUserId: number;

    @RelationField({
        type: 'ManyToOne',
        modelClass: () => UserModel,
        nullable: true,
    })
    creatorUser: UserModel;

    @RelationField({
        type: 'OneToMany',
        modelClass: () => CommentModel,
    })
    comments: CommentModel[];
}
