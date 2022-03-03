import {applyDecorators} from "@nestjs/common";

export const COMPUTABLE_FIELD_KEY = 'computable_field_key';

interface IComputableCallbackParams {
    value: any,
    source: any,
    options: {
        [key: string]: any,
    }
}

export const getComputableFieldCallback = (
    targetClass: any,
    fieldName: string
) => {
    const computableCallback = targetClass && Reflect.getMetadata(COMPUTABLE_FIELD_KEY, targetClass.prototype, fieldName);
    return {
        isComputableField: !!computableCallback,
        computableCallback,
    }
}

export const SetComputableFieldCallback = (data) => (object, propertyName) => {
    Reflect.defineMetadata(COMPUTABLE_FIELD_KEY, data, object, propertyName);
};

export function ComputableField(computableCallback: (params: IComputableCallbackParams) => any) {
    return applyDecorators(SetComputableFieldCallback(computableCallback))
}
