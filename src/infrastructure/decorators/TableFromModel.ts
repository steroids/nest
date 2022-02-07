import {DeepPartial, Entity} from 'typeorm';
import {DataMapperHelper} from '../../usecases/helpers/DataMapperHelper';
import {ExtendField} from './fields/ExtendField';
import {ClassConstructor} from 'class-transformer';
import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {applyDecorators} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {IBaseFieldOptions} from './fields/BaseField';

export interface ITableOptions {
    name: string,
    label?: string,
    modelClass?: any,
}
//
// export const createTableFromModel = <T>(ModelClass: any, tableName): ClassConstructor<DeepPartial<T>> => {
//
//     @Entity(tableName)
//     class Foo extends ModelClass {
//     }
//
//     return Foo;
//
//
//     // const target: any = class {
//     // };
//     //
//     // Entity(tableName)(target);
//     // console.log(123, tableName);
//     //
//     // const fields = DataMapperHelper.getKeys(ModelClass);
//     // fields.forEach(field => {
//     //     Reflect.defineProperty(target, field, {value: undefined});
//     //     ExtendField(ModelClass)(target.prototype, field);
//     // });
//     //
//     // return target;
// }

function TableFromModelInternal(ModelClass) {
    return (target) => {
        const fields = DataMapperHelper.getKeys(ModelClass);
        fields.forEach(field => {
            ExtendField(ModelClass)(target.prototype, field);
        });
    };
}


export function TableFromModel(ModelClass, tableName) {
    return applyDecorators(
        Entity(tableName),
        TableFromModelInternal(ModelClass),
    );
}

