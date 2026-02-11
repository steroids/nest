export function wrapInDoubleQuotes(str: string): string {
    let result = str;

    if (!result.startsWith('"')) {
        result = `"${result}`;
    }

    if (!result.endsWith('"')) {
        result = `${result}"`;
    }

    return result;
}
