import {describe, it, expect} from '@jest/globals';
import {RelationIdField, IRelationIdFieldOptions} from './RelationIdField';
import {buildDto, validateValue} from './BaseField_test/BaseField.helpers';

describe('RelationIdField decorator', () => {
    describe('arrayOptions.notEmpty constraint', () => {
        it('passes non-empty array', async () => {
            const Dto = buildDto(RelationIdField({
                isArray: true,
                nullable: false,
                arrayOptions: {notEmpty: true},
            }));
            const errors = await validateValue(Dto, [1, 2]);
            expect(errors).toHaveLength(0);
        });

        it.each([
            [
                {isArray: true, nullable: false, arrayOptions: {notEmpty: true}} as IRelationIdFieldOptions,
                'Массив не должен быть пустым',
            ],
            [
                {
                    isArray: true,
                    nullable: false,
                    arrayOptions: {
                        notEmpty: true,
                        notEmptyConstraintMessage: 'Список не должен быть пустым',
                    },
                },
                'Список не должен быть пустым',
            ],
        ])('reports message %#', async (options, expectedMessage) => {
            const Dto = buildDto(RelationIdField(options));
            const errors = await validateValue(Dto, []);
            expect(errors[0].constraints.arrayNotEmpty).toBe(expectedMessage);
        });
    });
});
