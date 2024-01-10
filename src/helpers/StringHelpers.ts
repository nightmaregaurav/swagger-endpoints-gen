import {CodeCase} from "../types/enums/CodeCase";

export const humanizeCodeCase = (source: string): string => {
    const codeCase = getCodeCase(source);
    switch (codeCase) {
        case CodeCase.CamelCase:
            return camelCaseToProperWord(source);
        case CodeCase.PascalCase:
            return pascalCaseToProperWord(source);
        case CodeCase.SnakeCase:
            return snakeCaseToProperWord(source);
        default:
            throw new Error(`Unknown code case: ${codeCase}`);
    }
}

const getCodeCase = (string: string): CodeCase => {
    if (string.match(/[A-Z][A-Za-z0-9]+/g)) {
        return CodeCase.PascalCase;
    } else if (string.match(/[a-z][A-Za-z0-9]+/g)) {
        return CodeCase.PascalCase;
    } else if (string.match(/[a-z][a-z0-9_]+/g)) {
        return CodeCase.SnakeCase;
    } else {
        return CodeCase.Invalid;
    }
}

const camelCaseToProperWord = (camelCaseString: string) => {
    const words = camelCaseString.split(/([A-Z][a-z0-9]*)/g);
    const properWords = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return properWords.join(" ").replace(/\s\s+/g, " ").trim();
}

const pascalCaseToProperWord = (pascalCaseString: string) => {
    const words = pascalCaseString.split(/([A-Z][a-z0-9]*)/g);
    const properWords = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return properWords.join(" ").replace(/\s\s+/g, " ").trim();
}

const snakeCaseToProperWord = (snakeCaseString: string) => {
    const words = snakeCaseString.split("_");
    const properWords = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return properWords.join(" ").replace(/\s\s+/g, " ").trim();
}

export const isNullOrUndefinedOrWhitespace = (value: string | null | undefined) => {
    return value == null || value.trim() === "";
}
