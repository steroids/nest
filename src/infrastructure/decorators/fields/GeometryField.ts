import {applyDecorators} from '@nestjs/common';
import {ApiPropertyOptions} from '@nestjs/swagger';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IGeometryFieldOptions extends IBaseFieldOptions {
    srid: number,
    spatialFeatureType: string,
    // Use to manually define a field type in Swagger.
    swaggerType?: ApiPropertyOptions['type'];
}

export function GeometryField(options: IGeometryFieldOptions = {
    srid: 4326,
    spatialFeatureType: 'Polygon',
}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'GeometryField',
            appType: 'geometry',
            swaggerType: options.swaggerType ?? 'object',
        }),
    ].filter(Boolean));
}
