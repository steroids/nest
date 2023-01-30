import {ClassSerializerInterceptor, PlainLiteralObject} from '@nestjs/common';
import {DataMapper} from '../../../usecases/helpers/DataMapper';

export class SchemaSerializer extends ClassSerializerInterceptor {
    transformToPlain(data: any, options: any): PlainLiteralObject {
        return DataMapper.create(Object, data);
    }
}
