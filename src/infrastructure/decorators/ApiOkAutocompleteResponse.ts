import {applyDecorators} from '@nestjs/common';
import {ApiExtraModels, ApiOkResponse, getSchemaPath} from '@nestjs/swagger';
import {AutocompleteBaseSchema} from '../../usecases/useCases/AutocompleteSearch/dtos/AutocompleteBaseSchema';
import {IType} from '../../usecases/interfaces/IType';


interface ApiOkAutocompleteResponseOptions {
    type: IType,
}

export function ApiOkAutocompleteResponse(options: ApiOkAutocompleteResponseOptions) {
    const itemType = options.type;
    return applyDecorators(
        ApiExtraModels(AutocompleteBaseSchema, itemType),
        ApiOkResponse({
            schema: {
                allOf: [
                    {$ref: getSchemaPath(AutocompleteBaseSchema)},
                    {
                        properties: {
                            items: {
                                type: 'array',
                                items: {$ref: getSchemaPath(itemType)},
                            },
                            selectedItems: {
                                type: 'array',
                                items: {$ref: getSchemaPath(itemType)},
                            },
                        },
                    },
                ],
            },
        }),
    );
}
