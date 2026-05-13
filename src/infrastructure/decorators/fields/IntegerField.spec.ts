import {describe, it, expect} from '@jest/globals';
import {IntegerField, IIntegerFieldOptions} from './IntegerField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('IntegerField decorator', () => {
    it('passes integer in [min, max] range', async () => {
        const Dto = buildDto(IntegerField({min: 5, max: 10}));
        const errors = await validateValue(Dto, 7);
        expect(errors).toHaveLength(0);
    });

    describe('IsInt constraint', () => {
        it.each([
            [{} as IIntegerFieldOptions, 'Должно быть числом'],
            [{isIntConstraintMessage: 'Только целые'}, 'Только целые'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(IntegerField(options));
            const errors = await validateValue(Dto, 1.5);
            expect(errors[0].constraints.isInt).toBe(expectedMessage);
        });
    });

    describe('Min constraint', () => {
        it.each([
            [{min: 5} as IIntegerFieldOptions, 'Должно быть не меньше 5'],
            [{min: 5, minIntConstraintMessage: 'Слишком мало'}, 'Слишком мало'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(IntegerField(options));
            const errors = await validateValue(Dto, 3);
            expect(errors[0].constraints.min).toBe(expectedMessage);
        });
    });

    describe('Max constraint', () => {
        it.each([
            [{max: 10} as IIntegerFieldOptions, 'Должно быть не больше 10'],
            [{max: 10, maxIntConstraintMessage: 'Слишком много'}, 'Слишком много'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(IntegerField(options));
            const errors = await validateValue(Dto, 15);
            expect(errors[0].constraints.max).toBe(expectedMessage);
        });
    });
});
