import {describe, it, expect} from '@jest/globals';
import {
    DateField,
    IDateFieldOptions,
    IS_ISO_8601_DEFAULT_MESSAGE,
    MIN_DATE_DEFAULT_MESSAGE_PREFIX,
    MAX_DATE_DEFAULT_MESSAGE_PREFIX,
} from './DateField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('DateField decorator', () => {
    it('passes ISO date within bounds', async () => {
        const Dto = buildDto(DateField({minDate: '2024-01-01', maxDate: '2024-12-31'}));
        const errors = await validateValue(Dto, '2024-06-01');
        expect(errors).toHaveLength(0);
    });

    describe('IsISO8601 constraint', () => {
        it.each([
            [{} as IDateFieldOptions, IS_ISO_8601_DEFAULT_MESSAGE],
            [{isISO8601ConstraintMessage: 'Не формат даты'}, 'Не формат даты'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DateField(options));
            const errors = await validateValue(Dto, 'not-a-date');
            expect(errors[0].constraints.isIso8601).toBe(expectedMessage);
        });
    });

    describe('MinDate constraint', () => {
        it.each([
            [{minDate: '2024-01-01'} as IDateFieldOptions, MIN_DATE_DEFAULT_MESSAGE_PREFIX],
            [{minDate: '2024-01-01', minDateConstraintMessage: 'Слишком ранняя дата'}, 'Слишком ранняя дата'],
        ])('reports message %#', async (options, expectedSubstring) => {
            const Dto = buildDto(DateField(options));
            const errors = await validateValue(Dto, '2023-01-01');
            expect(errors[0].constraints.minDate).toContain(expectedSubstring);
        });
    });

    describe('MaxDate constraint', () => {
        it.each([
            [{maxDate: '2024-12-31'} as IDateFieldOptions, MAX_DATE_DEFAULT_MESSAGE_PREFIX],
            [{maxDate: '2024-12-31', maxDateConstraintMessage: 'Слишком поздняя дата'}, 'Слишком поздняя дата'],
        ])('reports message %#', async (options, expectedSubstring) => {
            const Dto = buildDto(DateField(options));
            const errors = await validateValue(Dto, '2025-06-01');
            expect(errors[0].constraints.maxDate).toContain(expectedSubstring);
        });
    });
});
