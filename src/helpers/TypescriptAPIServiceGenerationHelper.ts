import path from "path";
import {GeneratorOptions} from "../types/Generator";
import {createFileWithContent} from "./FileHelpers";

export const createApiCallerService = (options: GeneratorOptions, outputDirectory: string) => {
    const apiCallerServiceFile = path.join(outputDirectory, "ApiCallerService.ts");
    const serviceCode = ApiCallerService
        .replace(/<<BEARER_TOKEN_IMPORT_PATH>>/g, options.getBearerTokenImportPath)
        .replace(/<<SUCCESS_ERROR_MIDDLEWARE_PATH>>/g, options.middlewaresImportPath)
        .replace(/<<BASE_URL>>/g, options.baseUrl ?? "");
    if (options.removeComments) {
        const lines = serviceCode.split("\n");
        const linesWithoutComments = lines.filter(line => !line.startsWith("//"));
        createFileWithContent(apiCallerServiceFile, linesWithoutComments.join("\n"));
        return;
    }
    createFileWithContent(apiCallerServiceFile, serviceCode);
}
