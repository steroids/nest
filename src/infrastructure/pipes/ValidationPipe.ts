import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {plainToInstance} from 'class-transformer';
import {validate} from 'class-validator';
import {ValidationException} from '../exception/ValidationException';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        const obj = plainToInstance(metadata.metatype, value) || {};
        if (typeof obj === 'object') {
            const errors = await validate(obj);
            if (errors.length) {
                throw new ValidationException({
                    errors: errors.reduce(
                        (result: any, item) => {
                            result[item.property] = []
                                .concat(obj[item.property] || [])
                                .concat(Object.values(item.constraints));
                            return result;
                        },
                        {},
                    ),
                });
            }
        }
        return value;
    }
}
