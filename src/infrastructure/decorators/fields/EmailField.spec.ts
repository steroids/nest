import {describe, it, expect} from '@jest/globals';
import {EmailField, IEmailFieldOptions} from './EmailField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('EmailField decorator', () => {
    describe('IsEmail constraint', () => {
        it('passes valid email', async () => {
            const Dto = buildDto(EmailField());
            const errors = await validateValue(Dto, 'user@example.com');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as IEmailFieldOptions, 'Некорректный email адрес'],
            [{isEmailConstraintMessage: 'Не email'}, 'Не email'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(EmailField(options));
            const errors = await validateValue(Dto, 'not-an-email');
            expect(errors[0].constraints.isEmail).toBe(expectedMessage);
        });
    });
});
