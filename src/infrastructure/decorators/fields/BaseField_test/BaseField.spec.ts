import {describe, it, expect} from '@jest/globals';
import {BaseField, IBaseFieldOptions, IS_NOT_EMPTY_DEFAULT_MESSAGE} from '../BaseField';
import {buildDto, validateValue} from './BaseField.helpers';

const buildBaseFieldDecorator = (options: IBaseFieldOptions) => BaseField(options, {
    decoratorName: 'TestField',
    appType: 'string',
    jsType: 'string',
});

describe('BaseField decorator', () => {
    describe('IsNotEmpty constraint', () => {
        it('passes when required value is present', async () => {
            const Dto = buildDto(buildBaseFieldDecorator({required: true}));
            const errors = await validateValue(Dto, 'value');
            expect(errors).toHaveLength(0);
        });

        it('skips validation when not required', async () => {
            const Dto = buildDto(buildBaseFieldDecorator({}));
            const errors = await validateValue(Dto, undefined);
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{required: true} as IBaseFieldOptions, IS_NOT_EMPTY_DEFAULT_MESSAGE],
            [{required: true, isNotEmptyConstraintMessage: 'Заполните'}, 'Заполните'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(buildBaseFieldDecorator(options));
            const errors = await validateValue(Dto, '');
            expect(errors[0].constraints.isNotEmpty).toBe(expectedMessage);
        });
    });
});
