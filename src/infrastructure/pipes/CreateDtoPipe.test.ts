import {ArgumentMetadata} from '@nestjs/common';
import {CreateDtoPipe} from './CreateDtoPipe';
import {IntegerField, RelationField, StringField} from '../decorators/fields';

class PipeNestedDto {
    @IntegerField()
    id: number;
}

class PipeDto {
    @IntegerField()
    id: number;

    @StringField()
    title: string;

    @RelationField({
        type: 'ManyToOne',
        relationClass: () => PipeNestedDto,
    })
    nested: PipeNestedDto;
}

const createMetadata = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({
    type: 'body',
    metatype,
    data: undefined,
});

describe('CreateDtoPipe', () => {
    it('creates DTO instance for plain object', async () => {
        const result = await new CreateDtoPipe().transform(
            {
                id: '10',
                title: 'First',
                nested: {
                    id: '20',
                },
            },
            createMetadata(PipeDto),
        ) as PipeDto;

        expect(result).toBeInstanceOf(PipeDto);
        expect(result.id).toBe(10);
        expect(result.title).toBe('First');
        expect(result.nested).toBeInstanceOf(PipeNestedDto);
        expect(result.nested.id).toBe(20);
    });

    it('does not transform array in global pipe when item metatype is unknown', async () => {
        const value = [
            {
                id: '10',
                title: 'First',
            },
        ];

        const result = await new CreateDtoPipe().transform(value, createMetadata(Array));

        expect(result).toBe(value);
    });

    it('creates DTO instances for array when item metatype is passed explicitly', async () => {
        const globalPipe = new CreateDtoPipe();
        const localPipe = new CreateDtoPipe(PipeDto);
        const value = [
            {
                id: '10',
                title: 'First',
                nested: {
                    id: '20',
                },
            },
            {
                id: '30',
                title: 'Second',
                nested: {
                    id: '40',
                },
            },
        ];

        const valueAfterGlobalPipe = await globalPipe.transform(value, createMetadata(Array));
        const result = await localPipe.transform(valueAfterGlobalPipe, createMetadata(Array)) as PipeDto[];

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(PipeDto);
        expect(result[0].id).toBe(10);
        expect(result[0].nested).toBeInstanceOf(PipeNestedDto);
        expect(result[0].nested.id).toBe(20);
        expect(result[1]).toBeInstanceOf(PipeDto);
        expect(result[1].id).toBe(30);
        expect(result[1].nested.id).toBe(40);
    });
});
