import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {DataMapper} from '../../usecases/helpers/DataMapper';
import {isMetaClass} from '../decorators/fields/BaseField';
import {plainToInstance} from 'class-transformer';
import {IType} from '../../usecases/interfaces/IType';

@Injectable()
export class CreateDtoPipe implements PipeTransform<any> {
    constructor(private readonly itemMetatype?: IType) {}

    async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
        const metatype = this.itemMetatype || metadata.metatype;

        // pipe не знает тип элементов массива.
        // Если он вызовет createDto(Array, value), то испортит value, поэтому value пропускается без изменений
        if (!this.itemMetatype && metadata.metatype === Array) {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map(item => this.createDto(metatype, item));
        }

        return this.createDto(metatype, value);
    }

    protected createDto(metatype: IType, value: unknown) {
        // Оставляем plainToInstance для конвертации значений 'false' -> false, '10' -> 10, ...
        value = plainToInstance(metatype, value);

        if (isMetaClass(metatype)) {
            value = DataMapper.create(metatype, value);
        }

        return value;
    }
}
