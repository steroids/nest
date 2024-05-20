import {describe, beforeAll, it, afterAll} from '@jest/globals';
import {bootstrap} from './bootstrap';
import {UserService} from './app/services/UserService';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {UserModel} from './app/models/UserModel';
import {FileService} from './app/services/FileService';
import {FileModel} from './app/models/FileModel';
import SearchQuery from '../../usecases/base/SearchQuery';
import {UserInfoModel} from './app/models/UserInfoModel';
import {ImageService} from './app/services/ImageService';
import {ImageModel} from './app/models/ImageModel';
import {ArticleService} from './app/services/ArticleService';
import {ArticleModel} from './app/models/ArticleModel';
import {TagModel} from './app/models/TagModel';
import {ArticleSchema} from './app/schemas/ArticleSchema';

const createPhoto = (app) => {
    return app.get(FileService).create(DataMapper.create<FileModel>(FileModel, {
        name: 'file ' + Date.now(),
        images: [
            {
                size: 'thumbnail',
                url: 'https://test.com/image-thumbnail.png',
            },
            {
                size: 'full',
                url: 'https://test.com/image-full.png',
            },
        ],
    }));
}

describe('ModelTest', () => {
    let app;
    beforeAll(async () => {
        app = await bootstrap();
    });

    /**
     * Want test relations saves:
     * - OneToMany::ids     v
     */
    it('OneToMany ids', async () => {
        // Create file and image models with OneToMany::ids relations
        const additionalImage1 = await app.get(ImageService).create(DataMapper.create<ImageModel>(ImageModel, {
            size: 'thumbnail',
            url: 'https://test.com/image-thumbnail.png',
        }));
        expect(additionalImage1?.id).toBeGreaterThan(0);

        let additionalPhoto = await app.get(FileService).create(DataMapper.create<FileModel>(FileModel, {
            name: 'file ' + Date.now(),
            imagesIds: [additionalImage1.id]
        }));
        expect(additionalPhoto?.id).toBeGreaterThan(0);
        expect(additionalPhoto?.imagesIds?.length).toEqual(1);

        additionalPhoto = await app.get(FileService).findOne(
            new SearchQuery()
                .with(['imagesIds'])
                .where({id: additionalPhoto.id})
        );

        expect(additionalPhoto?.id).toBeGreaterThan(0);
        expect(additionalPhoto?.imagesIds?.length).toEqual(1);
    });

    /**
     * Want test relations saves:
     * - ManyToMany::data   v
     */
    it('ManyToMany data', async () => {
        const passportScan = await createPhoto(app);

        let user: UserModel = await app.get(UserService).create(DataMapper.create<UserModel>(UserModel, {
            name: 'Test user ' + Date.now(),
            info: DataMapper.create<UserInfoModel>(UserInfoModel, {
                passport: '0409 123456',
                passportScanId: passportScan.id,
            }),
        }));

        // Create file and image models with OneToMany::ids relations
        let article = await app.get(ArticleService).create(DataMapper.create<ArticleModel>(ArticleModel, {
            title: 'How to load relations in entities',
            creatorUserId: user.id,
            tags: [
                DataMapper.create<TagModel>(TagModel, {title: 'Tag 1'}),
                DataMapper.create<TagModel>(TagModel, {title: 'Tag 2'}),
            ],
        }));
        expect(article?.id).toBeGreaterThan(0);
        expect(article?.tags?.length).toEqual(2);

        article = await app.get(ArticleService).findById(article.id, null, ArticleSchema);
        expect(article?.id).toBeGreaterThan(0);
        expect(article?.tags?.length).toEqual(2);

        // Check transform and computable decorators
        expect(article?.title).toEqual('HOW TO LOAD RELATIONS IN ENTITIES');
        expect(article?.shortTitle).toEqual('How t');
    });


    /**
     * Want test relations saves:
     * - ManyToOne::ids     v
     * - ManyToMany::ids    v
     * - OneToOne::data     v
     * - OneToMany::data    v
     */
    it('Complex test', async () => {
        // Create main photo: test OneToMany::data
        const mainPhoto = await createPhoto(app);
        expect(mainPhoto?.id).toBeGreaterThan(0);
        expect(mainPhoto?.images.length).toEqual(2);
        expect(mainPhoto?.images[0].id).toBeGreaterThan(0);
        expect(mainPhoto?.images[0].size).toEqual('thumbnail');
        expect(mainPhoto?.images[1].id).toBeGreaterThan(0);
        expect(mainPhoto?.images[1].size).toEqual('full');

        // Create photos for gallery
        const photos = [];
        for (let i = 0; i < 3; i++) {
            photos.push(await createPhoto(app));
        }

        // Create user: test ManyToOne::ids, ManyToMany::ids, OneToOne::data
        let user: UserModel = await app.get(UserService).create(DataMapper.create<UserModel>(UserModel, {
            name: 'Test user ' + Date.now(),
            info: DataMapper.create<UserInfoModel>(UserInfoModel, {
                passport: '0409 123456',
            }),
            mainPhotoId: mainPhoto.id,
            galleryPhotosIds: photos.map(photo => photo.id),
        }));
        expect(user?.id).toBeGreaterThan(0);
        expect(user?.mainPhotoId).toEqual(mainPhoto.id);
        expect(user?.galleryPhotosIds.length).toEqual(photos.length);

        // Get user from database with relations
        user = await app.get(UserService).findOne(
            new SearchQuery()
                .with(['mainPhotoId', 'galleryPhotosIds', 'info'])
                .where({id: user.id})
        );
        expect(user?.id).toBeGreaterThan(0);
        expect(user?.mainPhotoId).toEqual(mainPhoto.id);
        expect(user?.info?.passport).toEqual('0409 123456');
        expect(user?.galleryPhotosIds?.length).toEqual(photos.length);

        // console.log('TEST RESULT', user);
    });

    afterAll(async () => {
        await app.close();
    });
});
