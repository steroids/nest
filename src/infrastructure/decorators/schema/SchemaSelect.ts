export const STEROIDS_META_SCHEMA_SELECT = 'steroids_meta_schema_select';

export interface ISchemaOptions {
    select?: string[],
    excludeSelect?: string[],
}

export const getSchemaSelectOptions = (
    schemaClass,
) => schemaClass && Reflect.getMetadata(STEROIDS_META_SCHEMA_SELECT, schemaClass);

export function SchemaSelect(options: ISchemaOptions = {}) {
    return (target) => {
        Reflect.defineMetadata(STEROIDS_META_SCHEMA_SELECT, options, target);
    };
}

