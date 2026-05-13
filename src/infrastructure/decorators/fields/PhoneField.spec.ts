import {describe, it, expect} from '@jest/globals';
import {PhoneField, IPhoneFieldOptions} from './PhoneField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('PhoneField decorator', () => {
    describe('IsPhoneNumber constraint', () => {
        it('passes valid phone number', async () => {
            const Dto = buildDto(PhoneField());
            const errors = await validateValue(Dto, '+79161234567');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as IPhoneFieldOptions, 'Некорректный номер телефона'],
            [{constraintMessage: 'Не телефон'}, 'Не телефон'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(PhoneField(options));
            const errors = await validateValue(Dto, 'not-a-phone');
            expect(errors[0].constraints.isPhoneNumber).toBe(expectedMessage);
        });
    });
});
