import {describe, it, expect} from '@jest/globals';
import {TimeField, ITimeFieldOptions} from './TimeField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('TimeField decorator', () => {
    describe('IsMilitaryTime constraint', () => {
        it('passes valid HH:mm value', async () => {
            const Dto = buildDto(TimeField());
            const errors = await validateValue(Dto, '07:32');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{} as ITimeFieldOptions, 'Время необходимо ввести в формате часы:минуты, например 07:32'],
            [{isHhMmTimeConstraintMessage: 'Не время'}, 'Не время'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(TimeField(options));
            const errors = await validateValue(Dto, '25:99');
            expect(errors[0].constraints.isMilitaryTime).toBe(expectedMessage);
        });
    });
});
