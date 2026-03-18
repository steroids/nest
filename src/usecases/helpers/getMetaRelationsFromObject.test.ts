import {describe, expect, it} from '@jest/globals';
import {PrimaryKeyField} from '../../infrastructure/decorators/fields';
import {RelationField} from '../../infrastructure/decorators/fields';
import {RelationIdField} from '../../infrastructure/decorators/fields';
import {StringField} from '../../infrastructure/decorators/fields';
import {getMetaRelationsFromObject} from './getMetaRelationsFromObject';

class FileSchema {
    @PrimaryKeyField()
    id: number;

    @StringField()
    name: string;
}

class CompanySchema {
    @PrimaryKeyField()
    id: number;

    @StringField()
    title: string;
}

class UserProfileSchema {
    @PrimaryKeyField()
    id: number;

    @RelationIdField({relationName: 'avatar'})
    avatarId: number;

    @RelationField({
        type: 'OneToOne',
        isOwningSide: true,
        relationClass: () => FileSchema,
    })
    avatar: FileSchema;
}

class UserSchema {
    @PrimaryKeyField()
    id: number;

    @RelationIdField({relationName: 'company'})
    companyId: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => CompanySchema,
    })
    company: CompanySchema;

    @RelationField({
        type: 'OneToOne',
        isOwningSide: true,
        relationClass: () => UserProfileSchema,
    })
    profile: UserProfileSchema;

    @StringField()
    name: string;
}

class CommentSchema {
    @PrimaryKeyField()
    id: number;

    @RelationIdField({relationName: 'author'})
    authorId: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => UserSchema,
    })
    author: UserSchema;

    @StringField()
    text: string;
}

class TaskSchema {
    @PrimaryKeyField()
    id: number;

    @StringField()
    title: string;
}

class TagSchema {
    @PrimaryKeyField()
    id: number;

    @RelationIdField({relationName: 'creator'})
    creatorId: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => UserSchema,
    })
    creator: UserSchema;

    @StringField()
    name: string;
}

class PostMetaSchema {
    @PrimaryKeyField()
    id: number;

    @RelationIdField({relationName: 'previewImage'})
    previewImageId: number;

    @RelationField({
        type: 'OneToOne',
        isOwningSide: true,
        relationClass: () => FileSchema,
    })
    previewImage: FileSchema;
}

class PostSchema {
    @PrimaryKeyField()
    id: number;

    @RelationIdField({relationName: 'author'})
    authorId: number;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => UserSchema,
    })
    author: UserSchema;

    @RelationField({
        type: 'OneToOne',
        isOwningSide: true,
        relationClass: () => PostMetaSchema,
    })
    meta: PostMetaSchema;

    @RelationField({
        type: 'OneToMany',
        relationClass: () => CommentSchema,
        inverseSide: 'post',
    })
    comments: CommentSchema[];

    @RelationIdField({
        relationName: 'tasks',
        isArray: true,
    })
    tasksIds: number[];

    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => TaskSchema,
    })
    tasks: TaskSchema[];

    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => TagSchema,
    })
    tags: TagSchema[];

    @StringField()
    title: string;
}

describe('getMetaRelationsFromObject', () => {
    it('collects ManyToOne relationId field without loading relation object', () => {
        expect(getMetaRelationsFromObject({
            authorId: 10,
        }, PostSchema)).toEqual([
            'authorId',
        ]);
    });

    it('collects nested OneToOne relations with deeper relationId links', () => {
        expect(getMetaRelationsFromObject({
            meta: {
                previewImageId: 15,
            },
        }, PostSchema)).toEqual([
            'meta',
            'meta.previewImageId',
        ]);
    });

    it('collects nested relations from OneToMany arrays', () => {
        expect(getMetaRelationsFromObject({
            comments: [
                {
                    authorId: 3,
                },
                {
                    author: {
                        profile: {
                            avatarId: 7,
                        },
                    },
                },
            ],
        }, PostSchema)).toEqual([
            'comments',
            'comments.authorId',
            'comments.author',
            'comments.author.profile',
            'comments.author.profile.avatarId',
        ]);
    });

    it('collects nested relations from ManyToMany arrays', () => {
        expect(getMetaRelationsFromObject({
            tags: [
                {
                    creator: {
                        companyId: 22,
                        profile: {
                            avatarId: 11,
                        },
                    },
                },
            ],
        }, PostSchema)).toEqual([
            'tags',
            'tags.creator',
            'tags.creator.companyId',
            'tags.creator.profile',
            'tags.creator.profile.avatarId',
        ]);
    });

    it('collects relationId arrays without loading the relation itself', () => {
        expect(getMetaRelationsFromObject({
            tasksIds: [1, 2, 3],
        }, PostSchema)).toEqual([
            'tasksIds',
        ]);
    });

    it('collects mixed relation types once and ignores non-relation objects', () => {
        expect(getMetaRelationsFromObject({
            author: {
                companyId: 5,
            },
            meta: {
                previewImageId: 15,
            },
            comments: [
                {
                    authorId: 3,
                },
                {
                    payload: {
                        ignore: true,
                    },
                },
            ],
            tags: [
                {
                    creator: {
                        companyId: 22,
                    },
                },
                {
                    creatorId: 999,
                },
            ],
            extra: {
                nested: true,
            },
        }, PostSchema)).toEqual([
            'author',
            'author.companyId',
            'meta',
            'meta.previewImageId',
            'comments',
            'comments.authorId',
            'tags',
            'tags.creator',
            'tags.creator.companyId',
            'tags.creatorId',
        ]);
    });
});
