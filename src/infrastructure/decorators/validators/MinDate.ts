import {registerDecorator, ValidationArguments, ValidationOptions} from 'class-validator';
import {normalizeDate, normalizeFunctionDate} from '../fields/DateField';

type MinDateFunction = () => Date;

export function MinDate(minDate: string | Date | MinDateFunction, validationOptions?: ValidationOptions) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            name: 'minDate',
            target: object.constructor,
            propertyName,
            constraints: [minDate],
            options: validationOptions,
            validator: {
                validate (value: any, args: ValidationArguments) {
                    return new Date(normalizeDate(value)) >= new Date(normalizeFunctionDate(args.constraints[0], args));
                },
            },
        });
    };
}
