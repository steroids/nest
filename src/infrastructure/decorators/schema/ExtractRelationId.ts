import {applyDecorators, SetMetadata} from '@nestjs/common';

export const SCHEMA_META_EXTRACT_RELATION_ID = 'meta_extract_relation_id';

const getExtractRelationId = (target, key) => Reflect.getMetadata(SCHEMA_META_EXTRACT_RELATION_ID, target, key);

export function ExtractRelationId(): any {
    return applyDecorators(
        SetMetadata(SCHEMA_META_EXTRACT_RELATION_ID, true)
    );
}
