import {describe, it, expect} from '@jest/globals';
import {RelationIdField, IRelationIdFieldOptions, ARRAY_NOT_EMPTY_DEFAULT_MESSAGE} from './RelationIdField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('RelationIdField decorator', () => {
    describe('ArrayNotEmpty constraint', () => {
        it('passes non-empty array', async () => {
            const Dto = buildDto(RelationIdField({isArray: true, nullable: false}));
            const errors = await validateValue(Dto, [1, 2]);
            expect(errors).toHaveLength(0);
        });

        it.each([
            [{isArray: true, nullable: false} as IRelationIdFieldOptions, ARRAY_NOT_EMPTY_DEFAULT_MESSAGE],
            [
                {isArray: true, nullable: false, isFieldValidConstraintMessage: 'Список не должен быть пустым'},
                'Список не должен быть пустым',
            ],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(RelationIdField(options));
            const errors = await validateValue(Dto, []);
            expect(errors[0].constraints.arrayNotEmpty).toBe(expectedMessage);
        });
    });
});
