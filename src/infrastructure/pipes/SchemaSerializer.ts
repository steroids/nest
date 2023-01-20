import {ClassSerializerInterceptor, PlainLiteralObject} from '@nestjs/common';
import {ClassTransformOptions} from '@nestjs/common/interfaces/external/class-transform-options.interface';
import {DataMapper} from '../../usecases/helpers/DataMapper';

export class SchemaSerializer extends ClassSerializerInterceptor {
    transformToPlain(data: any, options: ClassTransformOptions): PlainLiteralObject {
        return DataMapper.create(Object, data);
    }
}
