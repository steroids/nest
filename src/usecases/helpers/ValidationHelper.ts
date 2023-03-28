import {isObject as _isObject} from 'lodash';
import {validate, ValidatorOptions} from 'class-validator';
import {ValidationException} from '../exceptions';
import {IValidator, IValidatorParams} from '../interfaces/IValidator';
import {FieldValidatorException} from '../exceptions/FieldValidatorException';
import {getMetaFields, isMetaClass} from '../../infrastructure/decorators/fields/BaseField';
import {getFieldValidators} from '../validators/Validator';

const defaultValidatorOptions: ValidatorOptions = {
    whitelist: false,
};

/**
 * @deprecated Use ValidationHelper.validate()
 */
export async function validateOrReject(dto: any, validatorOptions?: ValidatorOptions) {
    const errors = await validate(
        dto,
        {...defaultValidatorOptions, ...validatorOptions},
    );
    if (errors.length) {
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
    static async validate(dto: any, params: IValidatorParams = null, allValidators: IValidator[] = null) {
        await ValidationHelper.validateSingle(dto);
        const errors = await ValidationHelper.validateByInstances(dto, params, allValidators);
        if (errors && Object.keys(errors)?.length > 0) {
            throw new ValidationException(errors);
        }
    }

    /**
     * Validate by class-validator library (without custom class validators)
     * @param dto
     * @protected
     */
    protected static async validateSingle(dto: any) {
        const errors = await validate(dto, defaultValidatorOptions);
        if (errors.length) {
            throw new ValidationException(errors);
        }
    }

    /**
     * Validate by custom class validators
     * @param dto
     * @param params
     * @param validatorsInstances
     * @protected
     */
    protected static async validateByInstances(dto: any, params: IValidatorParams = null, validatorsInstances: IValidator[] = null) {
        if (!dto) {
            return;
        }

        const errors = {};

        const keys = isMetaClass(dto.constructor) ? getMetaFields(dto.constructor) : Object.keys(dto);
        for (const key of keys) {
            const value = dto[key];
            const nextParams = {
                ...params,
                name: key,
                prevModel: params?.prevModel?.[key] || null,
                nextModel: params?.nextModel?.[key] || null,
            };

            let error = null;

            try {
                if (Array.isArray(value)) {
                    for (const valueItemIndex in value) {
                        error = await ValidationHelper.validateByInstances(value[valueItemIndex], nextParams, validatorsInstances);

                        if (error) {
                            errors[key] = {
                                ...(errors?.[key] || {}),
                                [valueItemIndex]: error,
                            };
                        }
                    }
                } else if (value && _isObject(value)) {
                    // Nested validation for object
                    error = await ValidationHelper.validateByInstances(value, nextParams, validatorsInstances)

                    if (error) {
                        errors[key] = error;
                    }
                } else {
                    // Get field validators
                    const fieldValidators = getFieldValidators(dto.constructor, key);

                    for (const fieldValidator of fieldValidators) {
                        // Find validator instance
                        const validator = (validatorsInstances || []).find(item => item instanceof fieldValidator);
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
                    }
                }
            } catch (e) {
                // Check validator is throw specific exception
                if (e instanceof FieldValidatorException) {
                    errors[e.params?.name || key] = e.message;
                }
            }
        }


        // Has errors?
        if (Object.keys(errors).length > 0) {
            return errors;
        }
        return null;
    }
}
