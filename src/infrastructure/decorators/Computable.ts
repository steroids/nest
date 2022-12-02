import {ITransformCallback, Transform, TRANSFORM_TYPE_COMPUTABLE} from './Transform';

export type IComputableCallback = ITransformCallback;

export const Computable = (
    callback: IComputableCallback,
    transformType = TRANSFORM_TYPE_COMPUTABLE,
) => Transform(callback, transformType);

