import {describe, it, expect} from '@jest/globals';
import {TextField, ITextFieldOptions} from './TextField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('TextField decorator', () => {
    it('passes string within length bounds', async () => {
        const Dto = buildDto(TextField({min: 3, max: 10}));
        const errors = await validateValue(Dto, 'hello');
        expect(errors).toHaveLength(0);
    });

    describe('IsString constraint', () => {
        it.each([
            [{} as ITextFieldOptions, 'Должна быть строка'],
            [{isStringConstraintMessage: 'Не строка'}, 'Не строка'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(TextField(options));
            const errors = await validateValue(Dto, 42);
            expect(errors[0].constraints.isString).toBe(expectedMessage);
        });
    });

    describe('MinLength constraint', () => {
        it.each([
            [{min: 3} as ITextFieldOptions, 'Длина строки должна быть не менее 3'],
            [{min: 3, minConstraintMessage: 'Слишком коротко'}, 'Слишком коротко'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(TextField(options));
            const errors = await validateValue(Dto, 'ab');
            expect(errors[0].constraints.minLength).toBe(expectedMessage);
        });
    });

    describe('MaxLength constraint', () => {
        it.each([
            [{max: 5} as ITextFieldOptions, 'Длина строки должна быть не более 5'],
            [{max: 5, maxConstraintMessage: 'Слишком длинно'}, 'Слишком длинно'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(TextField(options));
            const errors = await validateValue(Dto, 'abcdefgh');
            expect(errors[0].constraints.maxLength).toBe(expectedMessage);
        });
    });
});
