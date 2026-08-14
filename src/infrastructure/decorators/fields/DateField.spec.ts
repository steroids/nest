import {describe, it, expect} from '@jest/globals';
import {DateField, IDateFieldOptions} from './DateField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('DateField decorator', () => {
    it('passes ISO date within bounds', async () => {
        const Dto = buildDto(DateField({minDate: '2024-01-01', maxDate: '2024-12-31'}));
        const errors = await validateValue(Dto, '2024-06-01');
        expect(errors).toHaveLength(0);
    });

    describe('IsISO8601 constraint', () => {
        it.each([
            [{} as IDateFieldOptions, 'Некорректный формат даты'],
            [{isISO8601ConstraintMessage: 'Не формат даты'}, 'Не формат даты'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(DateField(options));
            const errors = await validateValue(Dto, 'not-a-date');
            expect(errors[0].constraints.isIso8601).toBe(expectedMessage);
        });
    });

    describe('MinDate constraint', () => {
        it.each([
            [{minDate: '2024-01-01'} as IDateFieldOptions, 'Выбрана дата раньше минимально допустимой'],
            [{minDate: '2024-01-01', minDateConstraintMessage: 'Слишком ранняя дата'}, 'Слишком ранняя дата'],
            [
                {
                    minDate: '2024-01-01',
                    minDateConstraintMessage: (args) => `Раньше ${args.constraints[0]} нельзя`,
                } as IDateFieldOptions,
                'Раньше 2024-01-01 нельзя',
            ],
        ])('reports message %#', async (options, expectedSubstring) => {
            const Dto = buildDto(DateField(options));
            const errors = await validateValue(Dto, '2023-01-01');
            expect(errors[0].constraints.minDate).toContain(expectedSubstring);
        });
    });

    describe('MaxDate constraint', () => {
        it.each([
            [{maxDate: '2024-12-31'} as IDateFieldOptions, 'Выбрана дата позже максимально допустимой'],
            [{maxDate: '2024-12-31', maxDateConstraintMessage: 'Слишком поздняя дата'}, 'Слишком поздняя дата'],
            [
                {
                    maxDate: '2024-12-31',
                    maxDateConstraintMessage: (args) => `Позже ${args.constraints[0]} нельзя`,
                } as IDateFieldOptions,
                'Позже 2024-12-31 нельзя',
            ],
        ])('reports message %#', async (options, expectedSubstring) => {
            const Dto = buildDto(DateField(options));
            const errors = await validateValue(Dto, '2025-06-01');
            expect(errors[0].constraints.maxDate).toContain(expectedSubstring);
        });
    });
});
