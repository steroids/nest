import {describe, it, expect} from '@jest/globals';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {EnumField, IEnumFieldOptions} from './EnumField';
import BaseEnum from '../../../domain/base/BaseEnum';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

const fixtureColors = ['RED', 'GREEN', 'BLUE'];

class ColorEnum extends BaseEnum {
    static getKeys() {
        return fixtureColors;
    }
}

const decorators = [
    EnumField({enum: ColorEnum}),
    EnumField({enum: fixtureColors}),
    EnumField({
        enum: Object.fromEntries(fixtureColors.map(colorString => [colorString, colorString])),
    }),
];

describe('EnumField decorator', () => {
    describe('IsEnum constraint', () => {
        it('passes value matching enum', async () => {
            const Dto = buildDto(EnumField({enum: fixtureColors}));
            const errors = await validateValue(Dto, 'RED');
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{enum: fixtureColors} as IEnumFieldOptions, 'Выберите одно из значений'],
            [{enum: fixtureColors, isEnumConstraintMessage: 'Недопустимое значение'}, 'Недопустимое значение'],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(EnumField(options));
            const errors = await validateValue(Dto, 'YELLOW');
            expect(errors[0].constraints.isEnum).toBe(expectedMessage);
        });
    });

    describe('ApiProperty metadata', () => {
        it.each(decorators)('sets correct api properties to a field', (decorator) => {
            const targetPropertyKey = 'enumField';
            const targetObject = {};

            decorator(targetObject, targetPropertyKey);

            const fieldApiPropertyMeta = Reflect.getMetadata(
                DECORATORS.API_MODEL_PROPERTIES,
                targetObject,
                targetPropertyKey,
            );

            expect(fieldApiPropertyMeta.enum)
                .toEqual(fixtureColors);
        });
    });
});
