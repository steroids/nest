import {ClassSerializerInterceptor, PlainLiteralObject} from '@nestjs/common';
import {ClassTransformOptions} from '@nestjs/common/interfaces/external/class-transform-options.interface';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';

export class SchemaSerializer extends ClassSerializerInterceptor {
    transformToPlain(data: any, options: ClassTransformOptions): PlainLiteralObject {
        // TODO get schema class from context
        return DataMapperHelper.anyToPlain(data);
    }
}