import {registerDecorator, ValidationArguments, ValidationOptions} from 'class-validator';
import {normalizeDate, normalizeFunctionDate} from '../fields/DateField';

export function MinDate(minDate: string | Date | Function, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'minDate',
            target: object.constructor,
            propertyName,
            constraints: [minDate],
            options: validationOptions,
            validator: {
                validate: function (value: any, args: ValidationArguments) {
                    return new Date(normalizeDate(value)) >= new Date(normalizeFunctionDate(args.constraints[0], args));
                },
            },
        });
    };
}