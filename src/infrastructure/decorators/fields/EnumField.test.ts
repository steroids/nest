import {describe, it, expect} from '@jest/globals';
import {DECORATORS} from "@nestjs/swagger/dist/constants";
import { EnumField } from './EnumField';
import BaseEnum from '../../../domain/base/BaseEnum';



const fixtureColors = ['RED', 'GREEN', 'BLUE'];

// Create a simple BaseEnum subclass for testing
class ColorEnum extends BaseEnum {
    static getKeys() {
        return fixtureColors;
    }
}

const decorators = [
    EnumField({ enum: ColorEnum }),
    EnumField({ enum: fixtureColors }),
    EnumField({
        enum: Object.fromEntries(
            fixtureColors.map(colorString => [colorString, colorString])
        ),
    }),
];

describe('EnumField decorator', () => {
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