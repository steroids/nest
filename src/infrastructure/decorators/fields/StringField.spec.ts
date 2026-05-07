import {describe, it, expect} from '@jest/globals';
import {
    StringField,
    IStringFieldOptions,
    IS_STRING_DEFAULT_MESSAGE,
    MATCHES_DEFAULT_MESSAGE,
    buildMinLengthDefaultMessage,
    buildMaxLengthDefaultMessage,
} from './StringField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('StringField decorator', () => {
    it('passes string within bounds and matching regexp', async () => {
        const Dto = buildDto(StringField({min: 3, max: 10, regexp: /^[a-z]+$/}));
        const errors = await validateValue(Dto, 'hello');
        expect(errors).toHaveLength(0);
    });

    describe('IsString constraint', () => {
        it.each([
            [{required: true} as IStringFieldOptions, IS_STRING_DEFAULT_MESSAGE],
            [{required: true, isStringConstraintMessage: 'Не строка'}, 'Не строка'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(StringField(options));
            const errors = await validateValue(Dto, 42);
            expect(errors[0].constraints.isString).toBe(expectedMessage);
        });
    });

    describe('Matches constraint', () => {
        it.each([
            [{regexp: /^[a-z]+$/} as IStringFieldOptions, MATCHES_DEFAULT_MESSAGE],
            [{regexp: /^[a-z]+$/, regexpErrorMessage: 'Только строчные'}, 'Только строчные'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(StringField(options));
            const errors = await validateValue(Dto, 'HELLO');
            expect(errors[0].constraints.matches).toBe(expectedMessage);
        });
    });

    describe('MinLength constraint', () => {
        it.each([
            [{min: 3, required: true} as IStringFieldOptions, buildMinLengthDefaultMessage(3)],
            [{min: 3, required: true, minConstraintMessage: 'Слишком коротко'}, 'Слишком коротко'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(StringField(options));
            const errors = await validateValue(Dto, 'ab');
            expect(errors[0].constraints.minLength).toBe(expectedMessage);
        });
    });

    describe('MaxLength constraint', () => {
        it.each([
            [{max: 5, required: true} as IStringFieldOptions, buildMaxLengthDefaultMessage(5)],
            [{max: 5, required: true, maxConstraintMessage: 'Слишком длинно'}, 'Слишком длинно'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(StringField(options));
            const errors = await validateValue(Dto, 'abcdefgh');
            expect(errors[0].constraints.maxLength).toBe(expectedMessage);
        });
    });
});
