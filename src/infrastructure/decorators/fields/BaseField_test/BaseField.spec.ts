import {describe, it, expect} from '@jest/globals';
import {BaseField, IBaseFieldOptions} from '../BaseField';
import {buildDto, validateValue} from './BaseField.helpers';

const buildBaseFieldDecorator = (options: IBaseFieldOptions) => BaseField(options, {
    decoratorName: 'TestField',
    appType: 'string',
});

describe('BaseField decorator', () => {
    describe('required constraint', () => {
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

        it.each([undefined, null])('reports message for missing value %#', async (value) => {
            const Dto = buildDto(buildBaseFieldDecorator({required: true}));
            const errors = await validateValue(Dto, value);
            expect(errors[0].constraints.isDefined).toBe('Обязательно для заполнения');
        });
    });
});
