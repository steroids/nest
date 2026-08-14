import {describe, it, expect} from '@jest/globals';
import {PasswordField, IPasswordFieldOptions} from './PasswordField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('PasswordField decorator', () => {
    describe('IsStrongPassword constraint', () => {
        it('passes strong password', async () => {
            const Dto = buildDto(PasswordField());
            const errors = await validateValue(Dto, 'StrongP4ss');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as IPasswordFieldOptions, 'Ненадёжный пароль'],
            [{isStrongPasswordConstraintMessage: 'Слабый пароль'}, 'Слабый пароль'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(PasswordField(options));
            const errors = await validateValue(Dto, 'weak');
            expect(errors[0].constraints.isStrongPassword).toBe(expectedMessage);
        });
    });
});
