import {ClassSerializerInterceptor, PlainLiteralObject} from '@nestjs/common';
import {ClassTransformOptions} from '@nestjs/common/interfaces/external/class-transform-options.interface';
import {instanceToPlain} from 'class-transformer';

export class SchemaSerializer extends ClassSerializerInterceptor {
    transformToPlain(data: any, options: ClassTransformOptions): PlainLiteralObject {
        // TODO use DataMapper
        return instanceToPlain(data);
    }
}