import {applyDecorators} from '@nestjs/common';
import {ApiExtraModels, ApiOkResponse, getSchemaPath} from '@nestjs/swagger';
import {SearchSchema} from '../schemas/SearchSchema';

export function ApiOkSearchResponse(itemType) {
    return applyDecorators(
        ApiExtraModels(SearchSchema, itemType),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(SearchSchema) },
                    {
                        properties: {
                            items: {
                                type: 'array',
                                items: { $ref: getSchemaPath(itemType) },
                            },
                        },
                    },
                ],
            },
        }),
    );
}
