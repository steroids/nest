import {registerDecorator, ValidationArguments, ValidationOptions} from 'class-validator';
import {normalizeDate, normalizeFunctionDate} from '../fields/DateField';

type MaxDateFunction = () => Date;

export function MaxDate(maxDate: string | Date | MaxDateFunction, validationOptions?: ValidationOptions) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            name: 'maxDate',
            target: object.constructor,
            propertyName,
            constraints: [maxDate],
            options: validationOptions,
            validator: {
                validate (value: any, args: ValidationArguments) {
                    return new Date(normalizeDate(value)) <= new Date(normalizeFunctionDate(args.constraints[0], args));
                },
            },
        });
    };
}
