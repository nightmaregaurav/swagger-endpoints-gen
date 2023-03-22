import * as fs from "fs";
import * as path from "path";

export type GeneratorOptions = {
    outDir: string;
    bearerTokenImportPath?: string;
    successErrorMiddlewarePath?: string;
    baseUrl?: string;
    swaggers?: any[];
    swaggerUrls?: string[];
    removeComments?: boolean;
}

export async function createEndpointsAndModels(options: GeneratorOptions) {
    if(options.removeComments === undefined) options.removeComments = false;

    if (!fs.existsSync(options.outDir)) {
        fs.mkdirSync(options.outDir, { recursive: true });
    }

    if(options.swaggerUrls !== undefined) {
        for (const url of options.swaggerUrls) {
            const response = await fetch(url);
            const swagger = await response.json();
            if (options.swaggers === undefined) options.swaggers = [];
            options.swaggers.push(swagger);
        }
    }

    if (options.swaggers === undefined) return;

    const paths = options.swaggers.map(swagger => swagger.paths);
    const components = options.swaggers.map(swagger => swagger.components);


    let imports = "";
    let classTemplate = getTemplateString(options.removeComments);
    let classDefinition = "";
    for (const swaggerPaths of paths) {
        for (let endpointUrl in swaggerPaths) {
            let swaggerEndpoints = swaggerPaths[endpointUrl];
            for (let method in swaggerEndpoints) {
                let prefix = swaggerEndpoints[method].tags[0] ?? "API";

                let endpointName = `${prefix}__${method}_${endpointUrl
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .replace(/_{3,}/g, "__")
                    .replace(/_+$/g, "")
                    .toLowerCase()
                }`;
                let endpointMethod = method.toUpperCase();

                const args = `${parseParamTypes(swaggerEndpoints[method].parameters ?? [], "path")}`;
                const argsString = `${args ? "args: { " + args.trim() + " }" : ""}`;

                const queryArgs = `${parseParamTypes(swaggerEndpoints[method].parameters ?? [], "query")}`;
                const queryArgsString = `${queryArgs ? "params: { " + queryArgs.trim() + " }" : ""}`;


                const {dataType: reqTypeOfApiCall, importStatement: reqImportStatement, isNullable: reqIsNullable} = getReqResTypeOfApiCall(swaggerEndpoints[method]?.requestBody?? {});
                const {dataType: returnTypeOfApiCall, importStatement: resImportStatement, isNullable: resIsNullable} = getReqResTypeOfApiCall(swaggerEndpoints[method]?.responses?? {});

                const callDataParam = reqTypeOfApiCall == "void" ? "" : `data${reqIsNullable? "?" : ""}: ${reqTypeOfApiCall}`;
                const resDataType = returnTypeOfApiCall == "void" ? "void" : `${returnTypeOfApiCall}${resIsNullable? " | null | undefined" : ""}`;


                if(!imports.includes(reqImportStatement)) imports += reqImportStatement;
                if(!imports.includes(resImportStatement)) imports += resImportStatement;

                classDefinition += `    static ${endpointName} = class {\n`
                    + `        static method: requestMethod = "${endpointMethod}";\n`
                    + `        static getUrl = (${argsString}) => \`${endpointUrl.replace(/{/g, "${args.")}\`;\n`
                    + `        static call = async (${argsString ? argsString + ", " : ""}${callDataParam === "" ? "" : callDataParam + ", "}${queryArgsString === "" ? "" : queryArgsString + ", "}onError?: false | ((error: AxiosError) => void)) : Promise<AxiosResponse<${resDataType}>> => {\n`
                    + `            const url = new URL(this.getUrl(${argsString ? "args" : ""}), baseUrl).toString();\n`
                    + `            return await CallApi<${resDataType}>(url, this.method, ${callDataParam === "" ? "undefined" : "data"}, ${queryArgsString === "" ? "undefined" : " params"}, onError);\n`
                    + `        }\n`
                    + `    }\n`;
            }
        }
    }

    let result = imports + "\n" + classTemplate.replace("// <<< the endpoints will be generated here >>>", classDefinition);
    result = result.replace("<<BASE_URL>>", options.baseUrl ?? "");
    result = result.replace("<<BEARER_TOKEN_IMPORT_PATH>>", options.bearerTokenImportPath ?? "");
    result = result.replace("<<SUCCESS_ERROR_MIDDLEWARE_PATH>>", options.successErrorMiddlewarePath ?? "");

    fs.writeFileSync(path.join(options.outDir, `endpoints.ts`), getNotice(options.removeComments).concat(result));

    generateTypeScriptInterfacesForDtoModels(options.removeComments, path.join(options.outDir, "models"), ...components);
}

function parseParamTypes(parameters: any[], paramType: "query" | "path") {
    let args = "";
    for (const parameter of parameters) {
        if (paramType === "query" && parameter.in === "path") continue;
        if (paramType === "path" && parameter.in === "query") continue;

        let type = parameter.schema.type;
        if (type === "integer") {
            type = "number";
        } else if (type === "array") {
            const itemsType = parameter.schema.items.type;
            if (itemsType === "integer") {
                type = "number[]";
            }
            type = `${parameter.schema.items.type}[]`;
        }
        args += `${parameter.name}${parameter.required ? "" : "?"}: ${type}, `;
    }
    return args;
}

function generateTypeScriptInterfacesForDtoModels(removeComment: boolean, modelsDir: string, ...components: any[]) {
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir);
    }

    for (const component of components) {
        let schemas : any = component.schemas;
        if (schemas === undefined || schemas === null) schemas = {};

        for (const [name, schema] of Object.entries(component.schemas)) {
            if ((schema as any).enum !== undefined) {
                const enumName = name[0].toUpperCase() + name.slice(1);
                let enumString = `export enum ${enumName} {\n`;
                for (const enumValue of (schema as any).enum) {
                    if ((schema as any).type === "integer") {
                        enumString += `    E_${enumValue} = ${enumValue},\n`;
                    } else if ((schema as any).type === "string") {
                        enumString += `    ${enumValue} = "${enumValue}",\n`;
                    }
                }
                enumString += `}\n`;

                if (!fs.existsSync(`${modelsDir}/enums`)) {
                    fs.mkdirSync(`${modelsDir}/enums`);
                }

                fs.writeFileSync(path.join(`${modelsDir}/enums`, `${enumName}.ts`), getNotice(removeComment).concat(enumString));
                continue;
            }
            if ((schema as any).type !== 'object'){
                console.log(`Skipping ${name} because it's type ${(schema as any).type} is not currently supported!`);
                continue;
            }

            let properties: any = (schema as any).properties;
            if (properties === undefined || properties === null) properties = {};

            const interfaceName = name[0].toUpperCase() + name.slice(1);
            let interfaceString = `export interface ${interfaceName} {\n`;
            let importStatements = '';

            for (const [propertyName, property_] of Object.entries(properties)) {
                const property = property_ as any;
                let propertyType = property.type;
                const items = property.items;
                const nullable = property.nullable ?? false;

                if (property.$ref) {
                    const ref = property.$ref.split('/').pop();
                    propertyType = ref[0].toUpperCase() + ref.slice(1);
                    let importStatement = "";
                    let refSchema = schemas[ref];
                    if ((refSchema as any).enum !== undefined) importStatement = `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './enums/${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                    else importStatement = `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                    if (!importStatements.trim().includes(importStatement.trim())) importStatements += importStatement;
                } else if (propertyType === 'integer') {
                    propertyType = 'number';
                } else if (propertyType === 'object') {
                    propertyType = 'any';
                } else if (propertyType === 'array') {
                    if (items.$ref) {
                        const ref = items.$ref.split('/').pop();
                        propertyType = `${ref[0].toUpperCase() + ref.slice(1)}[]`;
                        let importStatement = `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                        if (!importStatements.trim().includes(importStatement.trim())) importStatements += importStatement;
                    } else if (items.type === 'integer') {
                        propertyType = 'number[]';
                    } else if (items.type === 'object') {
                        propertyType = 'any';
                    } else {
                        propertyType = `${items.type}[]`;
                    }
                }

                interfaceString += `  ${propertyName}${nullable ? '?' : ''}: ${propertyType};\n`;
            }

            interfaceString += '}\n';
            fs.writeFileSync(path.join(modelsDir, `${interfaceName}.ts`), getNotice(removeComment).concat(importStatements).concat(interfaceString));
        }

        fixImportedPropertyTypeInFilesCorrespondingToSchemas(modelsDir, component.schemas);
    }
}

const fixImportedPropertyTypeInFilesCorrespondingToSchemas = (modelsDir: string, schemas: any) => {
    for (const [name, _] of Object.entries(schemas)) {
        if ((_ as any).enum !== undefined) continue;
        const interfaceName = name[0].toUpperCase() + name.slice(1);
        let interfaceString = fs.readFileSync(path.join(modelsDir, `${interfaceName}.ts`), 'utf8');
        interfaceString = interfaceString.replace(new RegExp(`(\\w+)\\s*?:\\s*?${name}`, 'g'), `$1: ${interfaceName}`);
        fs.writeFileSync(path.join(modelsDir, `${interfaceName}.ts`), interfaceString);
    }
}

const getReqResTypeOfApiCall = (reqsRes: any) => {
    let importStatement = '';
    const response = reqsRes["200"] ?? reqsRes["201"] ?? reqsRes["204"] ?? reqsRes;

    if (response?.content) {
        const schema: any = response?.content?.['application/json']?.schema;
        if (!schema) return {dataType: "any", importStatement: "", isNullable: false};

        if (schema.$ref) {
            const ref = schema.$ref.split('/').pop();
            const retType = `${ref[0].toUpperCase() + ref.slice(1)}`;
            importStatement = `import { ${retType} } from './models/${retType}';\n`;
            return {dataType: retType, importStatement, isNullable: schema.nullable};
        } else if (schema.type === 'array') {
            const items = schema.items;
            if (items.$ref) {
                const ref = items.$ref.split('/').pop();
                const retType = `${ref[0].toUpperCase() + ref.slice(1)}[]`;
                importStatement = `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './models/${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                return {dataType: retType, importStatement, isNullable: schema.nullable};
            } else if (items.type === 'integer') {
                const retType = `number[]`;
                return {dataType: retType, importStatement, isNullable: schema.nullable};
            } else {
                const retType = `${items.type}[]`;
                return {dataType: retType, importStatement, isNullable: schema.nullable};
            }
        } else if (schema.type === 'integer') {
            return {dataType: 'number', importStatement, isNullable: schema.nullable};
        } else {
            return {dataType: schema.type, importStatement, isNullable: schema.nullable};
        }
    }
    return {dataType: 'void', importStatement, isNullable: false};
}

const getNotice: (removeComment: boolean) => string = (removeComment) => removeComment? "" : `// This file is generated using automated tool provided by NightmareGaurav (https://github.com/nightmaregaurav)
// Do not edit this file manually except for the lines annotated with a comment that ask you to fill in some details.
`;

const getTemplateString: (removeComment: boolean) => string = (removeComment) => `import axios, {AxiosError, AxiosRequestConfig, AxiosResponse, Method} from "axios";
${removeComment ? "" : "\n// Fill the import statements that provides the relevant functions.\n// getBearerToken() should take no arguments and should return a string containing the bearer token.\n// goToLoginPage() should neither take any arguments nor return any value but should redirect the user to the login page.\n// successMiddleware() should take an AxiosResponse as an argument and should return void.\n// errorMiddleware() should take an AxiosError as an argument and should return void."}
import {getBearerToken} from "<<BEARER_TOKEN_IMPORT_PATH>>";
import {successMiddleware, errorMiddleware} from "<<SUCCESS_ERROR_MIDDLEWARE_PATH>>";
${removeComment ? "" : "\n// Fill the value with the base url of the API."}
export const baseUrl: string = "<<BASE_URL>>";

export type requestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT";

async function CallApi<TResponse>(url: string, method: requestMethod, data?: {}, params?: {}, onError?: false | ((error: AxiosError) => void)) : Promise<AxiosResponse<TResponse>> {
    const token = getBearerToken();
    const headers = {'Authorization': \`Bearer ${"${token}"}\`}

    const apiCallData: AxiosRequestConfig = {
        method: method as Method,
        url: url,
        data: data,
        params: params,
        headers: headers
    };
    const axiosInstance = axios.create({baseURL: baseUrl})

    axiosInstance.interceptors.response.use((response: AxiosResponse) => {
        successMiddleware(response);
        return response;
    }, (error: AxiosError) => {
        errorMiddleware(error);
        return Promise.reject(error);
    });

    return await axiosInstance.request<TResponse>(apiCallData).catch((error: AxiosError) => {
        if (onError) onError(error);
        throw error.response ?? "Error while making request!";
    });
}

export class endpoints {
// <<< the endpoints will be generated here >>>}

`;

// Usage Example
// import swagger from './swagger.json';
// import swagger1 from './swagger1.json';
// import swagger2 from './swagger2.json';
// import swagger3 from './swagger3.json';
// createEndpointsAndModels({
//     outDir: "./endpoints",
//     bearerTokenImportPath: "./auth/authHelpers",
//     successErrorMiddlewarePath: "./middlewares/baseMiddlewares",
//     baseUrl: "https://api.example.com",
//     swaggers: [swagger, swagger1, swagger2, swagger3],
//     swaggerUrls: ["https://api.example.com/swagger/v1/swagger.json", "https://api.example.com/swagger/v2/swagger.json", "https://api.example.com/swagger/v3/swagger.json"]
// });
