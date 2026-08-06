import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';
import type {ISwaggerFieldType} from './helpers/InternalFieldMetadataHelpers';

export interface IGeometryFieldOptions extends IBaseFieldOptions {
    srid: number,
    spatialFeatureType: string,
    // Use to manually define a field type in Swagger.
    swaggerType?: ISwaggerFieldType,
}

export function GeometryField(options: IGeometryFieldOptions = {
    srid: 4326,
    spatialFeatureType: 'Polygon',
}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'GeometryField',
            appType: 'geometry',
            swaggerType: options.swaggerType ?? Object,
        }),
    ].filter(Boolean));
}
