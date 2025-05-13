import {Column} from '@steroidsjs/typeorm';
import {IGeometryFieldOptions} from '../../../fields/GeometryField';

export default (options: IGeometryFieldOptions) => [
    Column({
        type: 'geometry',
        default: options.defaultValue,
        nullable: options.nullable,
        srid: options.srid,
        spatialFeatureType: options.spatialFeatureType,
    }),
];
