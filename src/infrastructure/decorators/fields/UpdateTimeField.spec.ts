import {describe, it, expect} from '@jest/globals';
import {UpdateTimeField, IUpdateTimeFieldOptions} from './UpdateTimeField';
import {IS_STRING_DEFAULT_MESSAGE} from './StringField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('UpdateTimeField decorator', () => {
    describe('IsString constraint', () => {
        it('passes string value', async () => {
            const Dto = buildDto(UpdateTimeField());
            const errors = await validateValue(Dto, '2024-01-15 10:30:00');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as IUpdateTimeFieldOptions, IS_STRING_DEFAULT_MESSAGE],
            [{isStringConstraintMessage: 'Не строка'}, 'Не строка'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(UpdateTimeField(options));
            const errors = await validateValue(Dto, 42);
            expect(errors[0].constraints.isString).toBe(expectedMessage);
        });
    });
});
