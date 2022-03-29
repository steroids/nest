import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {isMetaClass} from '../decorators/fields/BaseField';
import {plainToInstance} from 'class-transformer';

@Injectable()
export class CreateDtoPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        return isMetaClass(metadata.metatype)
            ? DataMapper.create(metadata.metatype, value)
            : plainToInstance(metadata.metatype, value);
    }
}
