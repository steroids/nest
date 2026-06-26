import {describe, it, expect} from '@jest/globals';
import {DecimalNumberField} from './DecimalNumberField';
import {IDecimalFieldOptions} from './DecimalField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('DecimalNumberField decorator', () => {
    it('passes decimal number within bounds', async () => {
        const Dto = buildDto(DecimalNumberField({min: 5, max: 10}));
        const errors = await validateValue(Dto, 7.5);
        expect(errors).toHaveLength(0);
    });

    describe('IsDecimalNumber constraint', () => {
        it.each([
            [{} as IDecimalFieldOptions, 'Должно быть числом'],
            [{isDecimalConstraintMessage: 'Только число'}, 'Только число'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DecimalNumberField(options));
            const errors = await validateValue(Dto, '12.34');
            expect(errors[0].constraints.isDecimalNumber).toBe(expectedMessage);
        });
    });

    describe('Min constraint', () => {
        it.each([
            [{min: 5} as IDecimalFieldOptions, 'Должно быть не меньше 5'],
            [{min: 5, minDecimalConstraintMessage: 'Меньше нельзя'}, 'Меньше нельзя'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DecimalNumberField(options));
            const errors = await validateValue(Dto, 3.5);
            expect(errors[0].constraints.min).toBe(expectedMessage);
        });
    });

    describe('Max constraint', () => {
        it.each([
            [{max: 10} as IDecimalFieldOptions, 'Должно быть не больше 10'],
            [{max: 10, maxDecimalConstraintMessage: 'Больше нельзя'}, 'Больше нельзя'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DecimalNumberField(options));
            const errors = await validateValue(Dto, 15.5);
            expect(errors[0].constraints.max).toBe(expectedMessage);
        });
    });
});
