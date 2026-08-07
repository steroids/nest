import {describe, it, expect} from '@jest/globals';
import {EnumField} from './EnumField';
import {getFieldAppType, getFieldOptions} from './BaseField';
import BaseEnum from '../../../domain/base/BaseEnum';

const fixtureColors = ['RED', 'GREEN', 'BLUE'];

// Create a simple BaseEnum subclass for testing
class ColorEnum extends BaseEnum {
    static getKeys() {
        return fixtureColors;
    }
}

const enumFixtures = [
    ColorEnum,
    fixtureColors,
    Object.fromEntries(
        fixtureColors.map(colorString => [colorString, colorString]),
    ),
];

describe('EnumField decorator', () => {
    it.each(enumFixtures)('stores enum options in field metadata', (enumEntity) => {
        const targetPropertyKey = 'enumField';

        class TestSchema {}

        EnumField({enum: enumEntity})(TestSchema.prototype, targetPropertyKey);

        expect(getFieldOptions(TestSchema, targetPropertyKey).enum).toBe(enumEntity);
        expect(getFieldAppType(TestSchema, targetPropertyKey)).toBe('enum');
    });
});
