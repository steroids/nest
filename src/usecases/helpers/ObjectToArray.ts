export function ObjectToArray(object: Record<string, any>, keyPrefix: string = ''): any {
    if (!object) {
        return object;
    }
    return Object
        .entries(object)
        .reduce((array, [key, value]) => {
            array.push(...(value && typeof value === 'object'
                ? ObjectToArray(value, keyPrefix ? `${keyPrefix}.${key}` : key)
                : [[keyPrefix ? `${keyPrefix}.${key}` : key, value]]));
            return array;
        }, []);
}
