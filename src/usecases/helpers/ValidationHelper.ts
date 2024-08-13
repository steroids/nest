import {isObject as _isObject, mergeWith as _mergeWith} from 'lodash';
import {validate, ValidationError, ValidatorOptions} from 'class-validator';
import {ValidationException} from '../exceptions';
import {IValidator, IValidatorParams} from '../interfaces/IValidator';
import {FieldValidatorException} from '../exceptions/FieldValidatorException';
import {getMetaFields, isMetaClass} from '../../infrastructure/decorators/fields/BaseField';
import {getFieldValidators} from '../validators/Validator';
import {IErrorsCompositeObject} from '../interfaces/IErrorsCompositeObject';

const defaultValidatorOptions: ValidatorOptions = {
    whitelist: false,
    forbidUnknownValues: false,
};

/**
 * @deprecated Use ValidationHelper.validate()
 * @throws {ValidationException}
 */
export async function validateOrReject(dto: any, validatorOptions?: ValidatorOptions) {
    const classValidatorErrors = await validate(
        dto,
        {...defaultValidatorOptions, ...validatorOptions},
    );
    if (classValidatorErrors.length) {
        const errors = await ValidationHelper.parseClassValidatorErrors(classValidatorErrors);
        throw new ValidationException(errors);
    }
}

/**
 * Класс для запуска валидации DTO и моделей.
 * Чтобы сделать кастомную валидацию по классам, необходимо:
 *  1. Создать класс валидатора с интерфейсом IValidator
 *  2. Добавить его в providers модуля
 *  3. В сервис, который будет валидировать DTO, объявить в конструкторе
 *      `public validators: IValidator[]`
 *  4. В модуле пробросить экземпляр валидатора в сервис в массив validators.
 */
export class ValidationHelper {
    /**
     * validate object and throw error
     * @throws {ValidationException}
     */
    static async validate(dto: any, params: IValidatorParams = null, allValidators: IValidator[] = null) {
        const classValidatorErrors =  await this.getClassValidatorErrors(dto);
        const steroidsValidatorsErrors = await this.getSteroidsErrors(dto, params, allValidators);

        const errors = _mergeWith(
            classValidatorErrors,
            steroidsValidatorsErrors,
            (objValue: IErrorsCompositeObject, srcValue: IErrorsCompositeObject) => {
                if (Array.isArray(objValue)) {
                    return objValue.concat(srcValue);
                }
            },
        );

        if (errors && Object.keys(errors)?.length > 0) {
            throw new ValidationException(errors);
        }
    }

    /**
     * Validate by class-validator library (without custom class validators)
     * @param dto
     */
    public static async getClassValidatorErrors(dto: any): Promise<IErrorsCompositeObject | null> {
        const errors = await validate(dto, defaultValidatorOptions);
        if (errors.length) {
            return await this.parseClassValidatorErrors(errors);
        }
        return null;
    }

    /**
     * Validate by custom class validators
     * @param dto
     * @param params
     * @param validatorsInstances
     */
    public static async getSteroidsErrors(
        dto: any,
        params: IValidatorParams = null,
        validatorsInstances: IValidator[] = null,
    ): Promise<IErrorsCompositeObject | null> {
        if (!dto) {
            return;
        }

        const errors: IErrorsCompositeObject = {};

        const keys = isMetaClass(dto.constructor)
            ? getMetaFields(dto.constructor)
            : Object.keys(dto);

        for (const key of keys) {
            const value = dto[key];
            const nextParams = {
                ...params,
                name: key,
                prevModel: params?.prevModel?.[key] || null,
                nextModel: params?.nextModel?.[key] || null,
            };

            let keyErrors: string[] | IErrorsCompositeObject = null;

            if (Array.isArray(value)) {
                for (const valueItemIndex in value) {
                    const arrayItemErrors = await this.getSteroidsErrors(value[valueItemIndex], nextParams, validatorsInstances);

                    if (arrayItemErrors) {
                        keyErrors = {
                            ...(keyErrors || {}),
                            [valueItemIndex]: arrayItemErrors,
                        };
                    }
                }
            } else if (value && _isObject(value)) {
                // Nested validation for object
                keyErrors = await this.getSteroidsErrors(value, nextParams, validatorsInstances)
            }

            if (keyErrors) {
                errors[key] = keyErrors;
                continue;
            }

            // Get field validators
            const fieldValidators = getFieldValidators(dto.constructor, key);
            for (const fieldValidator of fieldValidators) {
                try {
                    // Find validator instance
                    const validator = (validatorsInstances || []).find(item => {
                        try {
                            return item instanceof fieldValidator;
                        } catch (e) {
                            return false;
                        }
                    });

                    if (!validator && typeof fieldValidator === 'function') {
                        await fieldValidator(dto, {
                            ...params,
                            name: key,
                        });
                        continue;
                    }

                    if (!validator) {
                        throw new Error(
                            `Not found validator instance for "${dto.constructor.name}.${key}."`
                            + ' Please add it to CrudService.validators array.'
                        );
                    }

                    // Run validator
                    await validator.validate(dto, {
                        ...params,
                        name: key,
                    });
                } catch (e) {
                    // Check validator is throw specific exception
                    if (e instanceof FieldValidatorException) {
                        if (keyErrors && Array.isArray(keyErrors)) {
                            keyErrors.push(e.message);
                        } else {
                            keyErrors = []
                                .concat(errors[e.params?.name || key])
                                .concat(e.message)
                                .filter(Boolean);
                        }
                    } else {
                        throw e;
                    }
                }

                if (keyErrors) {
                    errors[key] = keyErrors;
                }
            }
        }


        // Has errors?
        if (Object.keys(errors).length > 0) {
            return errors;
        }

        return null;
    }

    public static async parseClassValidatorErrors(errors: ValidationError[]): Promise<IErrorsCompositeObject> {
        if (!Array.isArray(errors)) {
            return errors;
        }

        const result: IErrorsCompositeObject = {};
        for (const error of errors) {
            if (error.constraints) {
                result[error.property] = [].concat(Object.values(error.constraints));
            }
            if (error.children?.length > 0) {
                result[error.property] = await this.parseClassValidatorErrors(error.children);
            }
        }

        return result;
    }
}
