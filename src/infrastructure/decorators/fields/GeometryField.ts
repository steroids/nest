import {applyDecorators} from '@nestjs/common';
import {BaseField, IBaseFieldOptions} from './BaseField';

export interface IGeometryFieldOptions extends IBaseFieldOptions {
    srid: number,
    spatialFeatureType: string,
}

export function GeometryField(options: IGeometryFieldOptions = {
    srid: 4326,
    spatialFeatureType: 'Polygon',
}) {
    return applyDecorators(...[
        BaseField(options, {
            decoratorName: 'GeometryField',
            appType: 'geometry',
            jsType: 'geometry',
        }),
    ].filter(Boolean));
}
