import {describe, it, expect} from '@jest/globals';
import {FileField, IFileField} from './FileField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('FileField decorator', () => {
    describe('IsInt constraint (single file)', () => {
        it('passes integer file id', async () => {
            const Dto = buildDto(FileField({}));
            const errors = await validateValue(Dto, 42);
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as IFileField, 'Необходимо загрузить файл'],
            [{isImage: true}, 'Необходимо загрузить изображение'],
            [{isFileConstraintMessage: 'Загрузите файл'}, 'Загрузите файл'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(FileField(options));
            const errors = await validateValue(Dto, 'abc');
            expect(errors[0].constraints.isInt).toBe(expectedMessage);
        });
    });

    describe('IsArray constraint (multiple files)', () => {
        it('passes array of file ids', async () => {
            const Dto = buildDto(FileField({multiple: true}));
            const errors = await validateValue(Dto, [1, 2]);
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{multiple: true} as IFileField, 'Необходимо загрузить файлы'],
            [{multiple: true, isImage: true}, 'Необходимо загрузить изображения'],
            [{multiple: true, isFileConstraintMessage: 'Загрузите файлы'}, 'Загрузите файлы'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(FileField(options));
            const errors = await validateValue(Dto, 42);
            expect(errors[0].constraints.isArray).toBe(expectedMessage);
        });
    });
});
