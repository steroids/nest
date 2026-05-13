import {describe, it, expect} from '@jest/globals';
import {BooleanField, IBooleanFieldOptions} from './BooleanField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('BooleanField decorator', () => {
    describe('IsBoolean constraint', () => {
        it.each([true, false])('passes boolean value %s', async (booleanValue) => {
            const Dto = buildDto(BooleanField());
            const errors = await validateValue(Dto, booleanValue);
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as IBooleanFieldOptions, 'Должен быть булевом'],
            [{isBooleanConstraintMessage: 'Не булево'}, 'Не булево'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(BooleanField(options));
            const errors = await validateValue(Dto, 'not-a-boolean');
            expect(errors[0].constraints.isBoolean).toBe(expectedMessage);
        });
    });
});
