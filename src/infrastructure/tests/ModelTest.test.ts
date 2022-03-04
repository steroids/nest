import {describe, beforeAll, it, afterAll} from '@jest/globals';
import {bootstrap} from './bootstrap';
import {UserService} from './app/services/UserService';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';
import {UserModel} from './app/models/UserModel';
import {FileService} from './app/services/FileService';
import {FileModel} from './app/models/FileModel';
import SearchQuery from '../../usecases/base/SearchQuery';

const createPhoto = (app) => {
    return app.get(FileService).create(DataMapperHelper.create<FileModel>(FileModel, {
        name: 'file ' + Date.now(),
        // images: [
        //     {
        //         size: 'thumbnail',
        //         url: 'https://test.com/image-thumbnail.png',
        //     },
        //     {
        //         size: 'full',
        //         url: 'https://test.com/image-full.png',
        //     },
        // ],
    }));
}

describe('ModelTest', () => {
    let app;
    beforeAll(async () => {
        app = await bootstrap();
    });

    /**
     * Want test relations saves:
     * - ManyToOne::ids
     * - ManyToMany::ids
     * - OneToMany::ids
     * - OneToOne::data
     * - ManyToMany::data
     * - OneToMany::data
     */
    it('Save test', async () => {
        // Create main photo: test ManyToOne::ids, ManyToMany::ids, OneToOne::data
        const mainPhoto = await createPhoto(app);
        expect(mainPhoto?.id).toBeGreaterThan(0);
        // expect(mainPhoto?.images.length).toEqual(2);
        // expect(mainPhoto?.images[0].id).toBeGreaterThan(0);
        // expect(mainPhoto?.images[0].size).toEqual('thumbnail');
        // expect(mainPhoto?.images[1].id).toBeGreaterThan(0);
        // expect(mainPhoto?.images[1].size).toEqual('full');

        // // Create photos for gallery
        // const photos = [];
        // for (let i = 0; i < 3; i++) {
        //     photos.push(await createPhoto(app));
        // }
        //
        // // Create user: test ManyToOne::ids, ManyToMany::ids, OneToOne::data
        // let user: UserModel = await app.get(UserService).create(DataMapperHelper.create<UserModel>(UserModel, {
        //     name: 'Test user ' + Date.now(),
        //     info: {
        //         passport: '123',
        //     },
        //     mainPhotoId: photos[0],
        //     galleryPhotosIds: photos.slice(1),
        // }));
        // expect(user?.id).toBeGreaterThan(0);
        // expect(user?.mainPhotoId).toEqual(photos[0]);
        // expect(user?.galleryPhotosIds.length).toEqual(photos.length - 1);
        //
        // // Get user from database with relations
        // user = await app.get(UserService).findOne(user.id, DataMapperHelper.create(SearchQuery, {
        //     relations: ['mainPhotoId', 'galleryPhotosIds']
        // }));
        // expect(user?.id).toBeGreaterThan(0);
        // expect(user?.mainPhotoId).toEqual(photos[0]);
        // expect(user?.galleryPhotosIds.length).toEqual(photos.length - 1);

        console.log(mainPhoto);
    });

    afterAll(async () => {
        await app.close();
    });
});
