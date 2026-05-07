import {describe, it, expect} from '@jest/globals';
import {CoordinateField, ICoordinateFieldOptions} from './CoordinateField';
import {IS_STRING_DEFAULT_MESSAGE} from './StringField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('CoordinateField decorator', () => {
    describe('IsString constraint', () => {
        it('passes string value', async () => {
            const Dto = buildDto(CoordinateField());
            const errors = await validateValue(Dto, '55.7558');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as ICoordinateFieldOptions, IS_STRING_DEFAULT_MESSAGE],
            [{isStringConstraintMessage: 'Не строка'}, 'Не строка'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(CoordinateField(options));
            const errors = await validateValue(Dto, 55.7558);
            expect(errors[0].constraints.isString).toBe(expectedMessage);
        });
    });
});
