import path from "path";
import {GeneratorOptions} from "./types/Generator";
import {getSwaggerJsonSpecificationFromUrl} from "./helpers/SwaggerHelper";
import {generateSchemaDefinitions} from "./helpers/TypescriptModelsGenerationHelper";
import {createApiCallerService} from "./helpers/TypescriptAPIServiceGenerationHelper";
import {generateEndpointDefinitions} from "./helpers/TypescriptEndpointsGenerationHelper";

export const createTypescriptEndpointsAndModels = async (options: GeneratorOptions) => {
    const swagger = await getSwaggerJsonSpecificationFromUrl(options.swaggerUrl);
    if (swagger == null) return;

    const endpoints = swagger.paths ?? [];
    const components = swagger.components?.schemas ?? swagger.definitions ?? {};

    const outDir = path.join(options.outDir, options.namespace.replaceAll(" ", ""));
    const modelsDir = path.join(outDir, "Models");
    generateSchemaDefinitions(options.removeComments, modelsDir, components);
    createApiCallerService(options, outDir);
    generateEndpointDefinitions(options.removeComments, outDir, endpoints);
}


// Usage Example
// createTypescriptEndpointsAndModels({
//     outDir: "./API",
//     namespace: "Pet Store",
//     swaggerUrl: "https://api.example.com/swagger/v1/swagger.json",
//     removeComments: false,
//     getBearerTokenImportPath: "../../../auth/authHelpers",
//     middlewaresImportPath: "../../..//middlewares/baseMiddlewares",
//     baseUrl: "https://api.example.com"
// });
