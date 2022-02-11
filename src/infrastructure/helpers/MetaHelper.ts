import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {MODEL_FIELD_NAMES_KEY, MODEL_META_KEY} from '../decorators/fields/BaseField';
import {IAllFieldOptions} from '../decorators/fields';
import {ISchemaOptions, SCHEMA_META_KEY} from '../decorators/SteroidsSchema';
import {IQueryRelation} from '../../usecases/base/SteroidsQuery';
import {IRelationFieldOptions} from '../decorators/fields/RelationField';

export class MetaHelper {
    static getFieldOptions(ModelClass, fieldName): IAllFieldOptions {
        return ModelClass && Reflect.hasMetadata(MODEL_META_KEY, ModelClass.prototype, fieldName)
            ? Reflect.getMetadata(MODEL_META_KEY, ModelClass.prototype, fieldName)
            : null;
    }

    static getFieldNames(AnyClass): string[] {
        return AnyClass && Reflect.hasMetadata(MODEL_FIELD_NAMES_KEY, AnyClass.prototype)
            ? Reflect.getMetadata(MODEL_FIELD_NAMES_KEY, AnyClass.prototype)
            : null;
    }

    static getSchemaOptions(SchemaClass): ISchemaOptions {
        return SchemaClass && Reflect.hasMetadata(SCHEMA_META_KEY, SchemaClass)
            ? Reflect.getMetadata(SCHEMA_META_KEY, SchemaClass)
            : null;
    }

    static getSchemaQueryData(SchemaClass): { select: string[], excludeSelect: string[], relations: IQueryRelation[] } {
        const options = this.getSchemaOptions(SchemaClass);

        const relations: IQueryRelation[] = [];
        (MetaHelper.getFieldNames(SchemaClass) || []).forEach(fieldName => {
            const modelMeta = MetaHelper.getFieldOptions(SchemaClass, fieldName) as IRelationFieldOptions;
            if (modelMeta.appType === 'relation') {
                if (/Ids?$/.exec(fieldName)) {
                    relations.push({
                        isId: true,
                        name: fieldName.replace(/Ids?$/, ''),
                        alias: fieldName,
                    });
                } else {
                    relations.push({
                        name: fieldName,
                        alias: fieldName,
                    });
                }
            }
        });

        return {
            select: options?.select || undefined,
            excludeSelect: options?.excludeSelect || undefined,
            relations: relations.length > 0 ? relations : undefined,
        };
    }

    static exportModels(types: any[]) {

        const result = {};
        types.forEach(type => {
            const fieldNames = this.getFieldNames(type);
            result[type.name] = {
                attributes: fieldNames.map(fieldName => {
                    const apiMeta = Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, type.prototype, fieldName);
                    const modelMeta = Reflect.getMetadata(MODEL_META_KEY, type.prototype, fieldName);

                    return {
                        attribute: fieldName,
                        type: modelMeta.appType || 'string',
                        label: modelMeta.label || apiMeta.description,
                        required: apiMeta.required,
                        ...(modelMeta.items ? {items: modelMeta.items} : {}),
                    };
                }),
            };

            // fields
        });
        return result;
    }

    static exportEnums(types: any[]) {
        const result = {};
        types.forEach(type => {
            if (type.toArray) {
                result[type.name] = {
                    labels: type.toArray(),
                };
            }
        });
        return result;
    }
}
