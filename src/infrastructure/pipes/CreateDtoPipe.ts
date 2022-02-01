import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {plainToInstance} from 'class-transformer';

@Injectable()
export class CreateDtoPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        return plainToInstance(metadata.metatype, value);
    }
}