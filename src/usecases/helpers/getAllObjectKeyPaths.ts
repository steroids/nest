export function getAllObjectKeyPaths(
    obj: Record<string, any>,
    prefix = '',
): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
        const keyPath = prefix
            ? `${prefix}.${key}`
            : key;

        return typeof value === 'object' && value !== null && !Array.isArray(value)
            ? [keyPath, ...getAllObjectKeyPaths(value, keyPath)]
            : [keyPath];
    });
}
