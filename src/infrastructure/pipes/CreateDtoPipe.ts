import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {isMetaClass} from '../decorators/fields/BaseField';
import {plainToInstance} from 'class-transformer';

@Injectable()
export class CreateDtoPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        // Оставляем plainToInstance для конвертации значений 'false' -> false, '10' -> 10, ...
        value = plainToInstance(metadata.metatype, value);

        if (isMetaClass(metadata.metatype)) {
            value = DataMapper.create(metadata.metatype, value);
        }

        return value;
    }
}
