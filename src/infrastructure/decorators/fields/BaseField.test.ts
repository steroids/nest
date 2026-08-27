import {describe, expect, it} from '@jest/globals';
import {
    DateField,
    DateTimeField,
    DecimalField,
    DecimalNumberField,
    EnumField,
    FileField,
    IntegerField,
    RelationField,
    RelationIdField,
    StringField,
    TextField,
} from './index';
import {ValidationHelper} from '../../../usecases/helpers/ValidationHelper';
import {ValidationException} from '../../../usecases/exceptions';
import {IErrorsCompositeObject} from '../../../usecases/interfaces/IErrorsCompositeObject';
import {DataMapper} from '../../../usecases/helpers/DataMapper';
import {getFieldOptions} from './BaseField';
import {TRANSFORM_TYPE_FROM_DB, TRANSFORM_TYPE_TO_DB} from '../Transform';

const API_MODEL_PROPERTIES_METADATA_KEY = 'swagger/apiModelProperties';

class ApiPropertiesDto {
    @StringField({
        required: true,
        nullable: true,
        isArray: true,
    })
    value: string[];

    @StringField()
    optionalValue?: string;
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
        arrayOptions: {
            notEmpty: true,
            notEmptyConstraintMessage: 'Выберите хотя бы одну связь',
            minLength: 1,
            maxLength: {
                value: 2,
                constraintMessage: 'Можно выбрать не более двух связей',
            },
        },
    })
    requiredRelationIds?: number[];

    @RelationIdField({
        isArray: true,
        nullable: false,
        arrayOptions: {
            notEmpty: true,
        },
    })
    legacyNotEmptyRelationIds?: number[];
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

class FileOptionsDto {
    @FileField({
        isArray: true,
    })
    fileIds?: number[];
}

class StringNotEmptyDto {
    @StringField({
        nullable: true,
        notEmpty: true,
    })
    value?: string;

    @StringField({
        notEmpty: true,
        notEmptyConstraintMessage: 'Строка должна быть заполнена',
    })
    valueWithCustomMessage?: string;

    @TextField({
        nullable: true,
        notEmpty: true,
    })
    text?: string;

    @TextField({
        notEmpty: true,
        notEmptyConstraintMessage: 'Текст должен быть заполнен',
    })
    textWithCustomMessage?: string;
}

class SupportedArrayFieldsDto {
    @StringField({isArray: true})
    strings?: string[];

    @TextField({isArray: true})
    texts?: string[];

    @IntegerField({isArray: true})
    integers?: number[];

    @DateField({isArray: true})
    dates?: string[];

    @DateTimeField({isArray: true})
    dateTimes?: string[];

    @DecimalField({isArray: true})
    decimals?: string[];

    @DecimalNumberField({isArray: true})
    decimalNumbers?: number[];

    @EnumField({
        enum: ['first', 'second'],
        isArray: true,
    })
    enums?: string[];

    @FileField({isArray: true})
    files?: number[];

    @RelationIdField({isArray: true})
    relationIds?: number[];

    @RelationField({
        type: 'ManyToMany',
        isOwningSide: true,
        relationClass: () => RelationTargetDto,
    })
    relations?: RelationTargetDto[];
}

class TransformFieldsDto {
    @DateField()
    date?: string;

    @DateField({isArray: true})
    dates?: string[];

    @DateTimeField({isArray: true})
    dateTimes?: string[];

    @DecimalNumberField()
    decimalNumber?: number;

    @DecimalNumberField({isArray: true})
    decimalNumbers?: number[];
}

class CustomArrayTransformDto {
    @StringField({
        isArray: true,
        transform: ({value}) => value.map(item => item.toUpperCase()),
    })
    values?: string[];
}

const getApiPropertyMeta = (TargetClass, propertyName: string) => Reflect.getMetadata(
    API_MODEL_PROPERTIES_METADATA_KEY,
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
        const optionalFieldApiPropertyMeta = getApiPropertyMeta(ApiPropertiesDto, 'optionalValue');

        expect(fieldApiPropertyMeta.required).toBe(true);
        expect(fieldApiPropertyMeta.nullable).toBe(true);
        expect(fieldApiPropertyMeta.isArray).toBe(true);
        expect(optionalFieldApiPropertyMeta.required).toBe(false);
        expect(optionalFieldApiPropertyMeta.nullable).toBe(false);
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
        }))).toMatchObject({
            requiredRelationIds: expect.arrayContaining(['Выберите хотя бы одну связь']),
        });
        expect((await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            requiredRelationIds: [1],
        }))) || {}).not.toHaveProperty('requiredRelationIds');
        expect((await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            requiredRelationIds: [1, 2],
        }))) || {}).not.toHaveProperty('requiredRelationIds');
        expect(await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            requiredRelationIds: [1, 2, 3],
        }))).toMatchObject({
            requiredRelationIds: expect.arrayContaining(['Можно выбрать не более двух связей']),
        });
        expect(await getValidationErrors(DataMapper.create(ArrayOptionsDto, {
            legacyNotEmptyRelationIds: [],
        }))).toMatchObject({
            legacyNotEmptyRelationIds: expect.arrayContaining(['Массив не должен быть пустым']),
        });

        const relationIdsApiPropertyMeta = getApiPropertyMeta(ArrayOptionsDto, 'requiredRelationIds');
        expect(relationIdsApiPropertyMeta.minItems).toBe(1);
        expect(relationIdsApiPropertyMeta.maxItems).toBe(2);
    });

    it('validates string and text notEmpty independently from required and nullable', async () => {
        expect((await getValidationErrors(DataMapper.create(StringNotEmptyDto, {}))) || {}).not.toHaveProperty('value');
        const nullErrors = await getValidationErrors(DataMapper.create(StringNotEmptyDto, {
            value: null,
            text: null,
        }));
        expect(nullErrors || {}).not.toHaveProperty('value');
        expect(nullErrors || {}).not.toHaveProperty('text');
        expect(await getValidationErrors(DataMapper.create(StringNotEmptyDto, {
            value: '',
            text: '',
        }))).toHaveProperty('value');
        expect(await getValidationErrors(DataMapper.create(StringNotEmptyDto, {
            valueWithCustomMessage: '',
        }))).toMatchObject({
            valueWithCustomMessage: expect.arrayContaining(['Строка должна быть заполнена']),
        });
        expect(await getValidationErrors(DataMapper.create(StringNotEmptyDto, {
            textWithCustomMessage: '',
        }))).toMatchObject({
            textWithCustomMessage: expect.arrayContaining(['Текст должен быть заполнен']),
        });
    });

    it('applies array validators to supported field decorators', async () => {
        const dto = Object.assign(new SupportedArrayFieldsDto(), {
            strings: 'first',
            texts: 'first',
            integers: 1,
            dates: '2026-08-26',
            dateTimes: '2026-08-26 12:30:00',
            decimals: '1.25',
            decimalNumbers: 1.25,
            enums: 'first',
            files: 1,
            relationIds: 1,
            relations: {title: 'First'},
        });
        const errors = await getValidationErrors(dto);

        expect(errors).toEqual(expect.objectContaining({
            strings: expect.anything(),
            texts: expect.anything(),
            integers: expect.anything(),
            dates: expect.anything(),
            dateTimes: expect.anything(),
            decimals: expect.anything(),
            decimalNumbers: expect.anything(),
            enums: expect.anything(),
            files: expect.anything(),
            relationIds: expect.anything(),
            relations: expect.anything(),
        }));
    });

    it('transforms scalar and array field values from database', () => {
        const dto = DataMapper.create(TransformFieldsDto, {
            date: '2026-08-26T12:30:00.000Z',
            dates: ['2026-08-26T12:30:00.000Z', '2026-08-27T12:30:00.000Z'],
            dateTimes: ['2026-08-26T12:30:00', '2026-08-27T12:30:00'],
            decimalNumber: '1.25',
            decimalNumbers: ['1.25', '2.5'],
        } as any, TRANSFORM_TYPE_FROM_DB);

        expect(dto.date).toBe('2026-08-26');
        expect(dto.dates).toEqual(['2026-08-26', '2026-08-27']);
        expect(dto.dateTimes).toEqual(['2026-08-26 12:30:00', '2026-08-27 12:30:00']);
        expect(dto.decimalNumber).toBe(1.25);
        expect(dto.decimalNumbers).toEqual([1.25, 2.5]);
    });

    it('transforms scalar and array date field values to database', () => {
        const dto = DataMapper.create(TransformFieldsDto, {
            date: '2026-08-26T12:30:00.000Z',
            dates: ['2026-08-26T12:30:00.000Z', '2026-08-27T12:30:00.000Z'],
        }, TRANSFORM_TYPE_TO_DB);

        expect(dto.date).toBe('2026-08-26');
        expect(dto.dates).toEqual(['2026-08-26', '2026-08-27']);
    });

    it('passes the whole array to a custom field transform', () => {
        const dto = DataMapper.create(CustomArrayTransformDto, {
            values: ['first', 'second'],
        });

        expect(dto.values).toEqual(['FIRST', 'SECOND']);
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

    it('passes file fields through base array options', async () => {
        const fileIdsApiPropertyMeta = getApiPropertyMeta(FileOptionsDto, 'fileIds');
        const fileIdsOptions = getFieldOptions(FileOptionsDto, 'fileIds');
        const dtoWithScalarFileValue = DataMapper.create(FileOptionsDto, {
            fileIds: 1,
        } as any) as FileOptionsDto;

        expect(fileIdsApiPropertyMeta.isArray).toBe(true);
        expect(fileIdsOptions.isArray).toBe(true);
        expect(dtoWithScalarFileValue.fileIds).toEqual([1]);
        expect((await getValidationErrors(dtoWithScalarFileValue)) || {}).not.toHaveProperty('fileIds');
    });
});
