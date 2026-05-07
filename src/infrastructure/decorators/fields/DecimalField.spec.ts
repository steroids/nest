import {describe, it, expect} from '@jest/globals';
import {
    DecimalField,
    IDecimalFieldOptions,
    IS_DECIMAL_DEFAULT_MESSAGE,
    buildMinDecimalDefaultMessage,
    buildMaxDecimalDefaultMessage,
} from './DecimalField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('DecimalField decorator', () => {
    it('passes decimal-formatted string within bounds', async () => {
        const Dto = buildDto(DecimalField({min: 5, max: 10}));
        const errors = await validateValue(Dto, '7.5');
        expect(errors).toHaveLength(0);
    });

    describe('IsDecimal constraint', () => {
        it.each([
            [{} as IDecimalFieldOptions, IS_DECIMAL_DEFAULT_MESSAGE],
            [{isDecimalConstraintMessage: 'Только дробное'}, 'Только дробное'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DecimalField(options));
            const errors = await validateValue(Dto, 'abc');
            expect(errors[0].constraints.isDecimal).toBe(expectedMessage);
        });
    });

    describe('StringMin constraint', () => {
        it.each([
            [{min: 5} as IDecimalFieldOptions, buildMinDecimalDefaultMessage(5)],
            [{min: 5, minDecimalConstraintMessage: 'Меньше нельзя'}, 'Меньше нельзя'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DecimalField(options));
            const errors = await validateValue(Dto, '3.5');
            expect(errors[0].constraints.minStringAsNumber).toBe(expectedMessage);
        });
    });

    describe('StringMax constraint', () => {
        it.each([
            [{max: 10} as IDecimalFieldOptions, buildMaxDecimalDefaultMessage(10)],
            [{max: 10, maxDecimalConstraintMessage: 'Больше нельзя'}, 'Больше нельзя'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DecimalField(options));
            const errors = await validateValue(Dto, '15.5');
            expect(errors[0].constraints.minStringAsNumber).toBe(expectedMessage);
        });
    });
});
