import {applyDecorators} from '@nestjs/common';
import {ApiExtraModels, ApiOkResponse, getSchemaPath} from '@nestjs/swagger';
import {SearchSchema} from '../schemas/SearchSchema';

interface ApiOkSearchResponseOptions {
    type: Function,
}

export function ApiOkSearchResponse(options: ApiOkSearchResponseOptions) {
    const itemType = options.type;
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
