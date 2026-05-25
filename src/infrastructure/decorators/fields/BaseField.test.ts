import {describe, expect, it} from '@jest/globals';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {IntegerField, RelationField, RelationIdField, StringField} from './index';
import {ValidationHelper} from '../../../usecases/helpers/ValidationHelper';
import {ValidationException} from '../../../usecases/exceptions';
import {IErrorsCompositeObject} from '../../../usecases/interfaces/IErrorsCompositeObject';
import {DataMapper} from '../../../usecases/helpers/DataMapper';

class ApiPropertiesDto {
    @StringField({
        required: true,
        nullable: true,
        isArray: true,
    })
    value: string[];
}

class RequiredNullableDto {
    @StringField()
    optionalNotNullable?: string;

    @StringField({
        nullable: true,
    })
    optionalNullable?: string | null;

    @StringField({
        required: true,
        nullable: true,
    })
    requiredNullable?: string | null;

    @StringField({
        required: true,
        nullable: false,
    })
    requiredNotNullable?: string | null;
}

class ArrayOptionsDto {
    @IntegerField({
        isArray: true,
    })
    ids?: number[];

    @RelationIdField({
        isArray: true,
        nullable: false,
        arrayNotEmpty: true,
    })
    requiredRelationIds?: number[];
}

class RelationTargetDto {
    @StringField()
    title: string;
}

class RelationOptionsDto {
    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => RelationTargetDto,
    })
    manyRelations?: RelationTargetDto[];

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => RelationTargetDto,
        nullable: true,
    })
    nullableRelation?: RelationTargetDto | null;
}

const getApiPropertyMeta = (TargetClass, propertyName: string) => Reflect.getMetadata(
    DECORATORS.API_MODEL_PROPERTIES,
    TargetClass.prototype,
    propertyName,
);

const getValidationErrors = async (object: object): Promise<IErrorsCompositeObject | null> => {
    try {
        await ValidationHelper.validate(object);
        return null;
    } catch (error) {
        if (error instanceof ValidationException) {
            return error.errors;
        }
        throw error;
    }
};

describe('BaseField decorator', () => {
    it('sets required, nullable and isArray api properties', () => {
        const fieldApiPropertyMeta = getApiPropertyMeta(ApiPropertiesDto, 'value');

        expect(fieldApiPropertyMeta.required).toBe(true);
        expect(fieldApiPropertyMeta.nullable).toBe(true);
        expect(fieldApiPropertyMeta.isArray).toBe(true);
    });

    it('validates required and nullable combinations', async () => {
        expect((await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            optionalNotNullable: undefined,
        }))) || {}).not.toHaveProperty('optionalNotNullable');
        expect(await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            optionalNotNullable: null,
        }))).toHaveProperty('optionalNotNullable');
        expect((await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            optionalNullable: undefined,
        }))) || {}).not.toHaveProperty('optionalNullable');
        expect((await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            optionalNullable: null,
        }))) || {}).not.toHaveProperty('optionalNullable');
        expect(await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            requiredNullable: undefined,
        }))).toHaveProperty('requiredNullable');
        expect((await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            requiredNullable: null,
        }))) || {}).not.toHaveProperty('requiredNullable');
        expect(await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            requiredNotNullable: undefined,
        }))).toHaveProperty('requiredNotNullable');
        expect(await getValidationErrors(DataMapper.create(RequiredNullableDto, {
            requiredNotNullable: null,
        }))).toHaveProperty('requiredNotNullable');
    });

    it('validates array options', async () => {
        const dtoWithScalarArrayValue = DataMapper.create(ArrayOptionsDto, {
            ids: 1,
        } as any) as ArrayOptionsDto;

        expect(dtoWithScalarArrayValue.ids).toEqual([1]);
        expect((await getValidationErrors(dtoWithScalarArrayValue)) || {}).not.toHaveProperty('ids');
        expect((await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            ids: [1],
        }))) || {}).not.toHaveProperty('ids');
        expect(await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            requiredRelationIds: [],
        }))).toHaveProperty('requiredRelationIds');
        expect((await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            requiredRelationIds: [1],
        }))) || {}).not.toHaveProperty('requiredRelationIds');
    });

    it('applies base options to relation fields', async () => {
        const manyRelationsApiPropertyMeta = getApiPropertyMeta(RelationOptionsDto, 'manyRelations');
        const nullableRelationApiPropertyMeta = getApiPropertyMeta(RelationOptionsDto, 'nullableRelation');

        expect(manyRelationsApiPropertyMeta.isArray).toBe(true);
        expect(nullableRelationApiPropertyMeta.isArray).toBe(false);
        expect(nullableRelationApiPropertyMeta.nullable).toBe(true);
        const dtoWithScalarRelationValue = DataMapper.create(RelationOptionsDto, {
            manyRelations: {title: 'First'},
        } as any) as RelationOptionsDto;

        expect(dtoWithScalarRelationValue.manyRelations).toHaveLength(1);
        expect(dtoWithScalarRelationValue.manyRelations[0]).toBeInstanceOf(RelationTargetDto);
        expect((await getValidationErrors(dtoWithScalarRelationValue)) || {}).not.toHaveProperty('manyRelations');
        expect((await getValidationErrors(DataMapper.create(RelationOptionsDto, {
            manyRelations: [{title: 'First'}],
        }))) || {}).not.toHaveProperty('manyRelations');
        expect((await getValidationErrors(DataMapper.create(RelationOptionsDto, {
            nullableRelation: null,
        }))) || {}).not.toHaveProperty('nullableRelation');
    });
});
