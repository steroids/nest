export const SCHEMA_META_KEY = 'meta';

export interface ISchemaOptions {
    select?: string[],
    excludeSelect?: string[],
}

export function SteroidsSchema(options: ISchemaOptions = {}) {
    return (target) => {
        Reflect.defineMetadata(SCHEMA_META_KEY, options, target);
    };
}

