export function ObjectToArray(object: Record<string, any>, keyPrefix: string = '') {
    return Object
        .entries(object)
        .reduce((array, [key, value]) => ([
            ...array,
            ...(typeof value === 'object'
                ? ObjectToArray(value, keyPrefix ? `${keyPrefix}.${key}` : key)
                : [[keyPrefix ? `${keyPrefix}.${key}` : key, value]]),
        ]), []);
}
