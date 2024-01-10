import path from "path";
import {
    ApiOperationObject, BodyParameterDefinition,
    ParameterDefinition,
    PathHttpMethodDefinitionObjectType,
    PathHttpMethodDefinitions
} from "../types/PathDefinition";
import {createFileWithContent} from "./FileHelpers";
import {HttpMethod} from "../types/enums/HttpMethod";
import {OpenApiParameterLocation} from "../types/enums/OpenApiParameterLocation";
import {ModelDefinition} from "../types/ModelDefinition";
import {getImportAndTypeStringFromModelDefinition} from "./TypescriptModelsGenerationHelper";
import {ObjectEnumModelDefinition} from "../types/Swagger";
import {OpenApiMimeType} from "../types/enums/OpenApiMimeType";
import {isNullOrUndefinedOrWhitespace} from "./StringHelpers";

export const generateEndpointDefinitions = (removeComments: boolean, outputDirectory: string, paths: PathHttpMethodDefinitions) => {
    let endpointDefinitions = "";
    for (const path in paths) {
        const pathHttpMethodDefinitions = paths[path];
        for (const httpMethod in pathHttpMethodDefinitions) {
            const endpointDefinition = pathHttpMethodDefinitions[httpMethod as keyof PathHttpMethodDefinitionObjectType];
            endpointDefinitions += generateEndpointDefinition(removeComments, path, httpMethod as HttpMethod, endpointDefinition);
        }
    }
    const endpointDefinitionsFileContent = ApiDefinitionClass.replace("<<< the endpoints will be generated here >>>", endpointDefinitions);
    const endpointDefinitionsFilePath = path.join(outputDirectory, "Endpoints.ts");
    createFileWithContent(endpointDefinitionsFilePath, endpointDefinitionsFileContent);
}

export const generateEndpointDefinition = (removeComments: boolean, path: string, httpMethod: HttpMethod, endpointDefinition: ApiOperationObject, schemas: ObjectEnumModelDefinition) => {
    let namePrefix = endpointDefinition.tags[0] ?? "API";
    const endpointName = getEndpointName(namePrefix, httpMethod, path);
    const endpoint = getEndpoint(path);
    const endpointMethod = httpMethod.toUpperCase();
    const pathParameters = (endpointDefinition.parameters ?? []).filter(parameter => parameter.in === OpenApiParameterLocation.Path);
    const queryParameters = (endpointDefinition.parameters ?? []).filter(parameter => parameter.in === OpenApiParameterLocation.Query);

    if (endpointDefinition.requestBody) {
        const requestBody = endpointDefinition.requestBody.content
        const availableMimeTypes = Object.keys(requestBody);
        const requestBodyDefinition = requestBody[availableMimeTypes[0] as OpenApiMimeType];
        const requestBodySchema = requestBodyDefinition.schema;
        const {importString: bodyImportString, typeString: bodyTypeString} = getImportAndTypeStringFromModelDefinition(requestBodySchema, schemas);
    } else {
        const bodyParameter = (endpointDefinition.parameters ?? []).find(parameter => parameter.in === OpenApiParameterLocation.Body);
        if(bodyParameter) {
            const bodySchema = (bodyParameter as BodyParameterDefinition).schema;
            const {importString: bodyImportString, typeString: bodyTypeString} = getImportAndTypeStringFromModelDefinition(bodySchema, schemas);
        } else {
            const bodyParameters = (endpointDefinition.parameters ?? []).filter(parameter => parameter.in === OpenApiParameterLocation.FormData);
            const {importString: bodyImportString, typeString: bodyTypeString} = getParameterDefinition(bodyParameters, schemas);
        }
    }

    const {importString: pathImportString, typeString: pathTypeString} = getParameterDefinition(pathParameters, schemas);
    const {importString: queryImportString, typeString: queryTypeString} = getParameterDefinition(queryParameters, schemas);

    const classDefinition = `    static ${endpointName} = class {\n`
        + `        static method: RequestMethod = "${endpointMethod}";\n`
        + `        static getUrl = (${pathTypeString ? "args: " + pathTypeString : ""}) => \`${endpoint}\`;\n`
        + `        static call: async () => {\n`
        + `            const url = this.getUrl(${pathTypeString ? "pathArgs" : ""});`
        + `            return await CallApi<${responseType}>(url, this.method);\n`
}

const getEndpointName = (namePrefix: string, httpMethod: HttpMethod, path: string) => {
    return `${namePrefix}__${httpMethod}_${path
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_{3,}/g, "__")
        .replace(/_+$/g, "")
        .toLowerCase()
    }`;
}

const getEndpoint = (path: string) => {
    return path.replace(/{/g, "${args.");
}

const getParameterDefinition = (parameters: ParameterDefinition[], schemas: ObjectEnumModelDefinition) => {
    let importStringTypeStringSet = new Set<{importString: string, typeString: string, name: string, required: boolean}>();
    for (const parameter of parameters) {
        const parameterName = parameter.name;
        const required = parameter.required ?? false;
        const {importString: _importString, typeString: _typeString} = getImportAndTypeStringFromModelDefinition(parameter as ModelDefinition, schemas);
        importStringTypeStringSet.add({importString: _importString, typeString: _typeString, name: parameterName, required});
    }
    const importString = Array.from(importStringTypeStringSet).filter(x => !isNullOrUndefinedOrWhitespace(x.importString)).map(importStringTypeString => importStringTypeString.importString).join("\n");
    const typeString = `{${Array.from(importStringTypeStringSet).map(importStringTypeString => importStringTypeString.name + importStringTypeString.required ? "" : "?" + ": " + importStringTypeString.typeString).join(", ")}}`;
    return {importString, typeString};

}
