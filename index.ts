import * as fs from "fs";
import * as path from "path";

export function createEndpointsAndModels(target_dir: string, ...swaggers: any[]) {
    if (!fs.existsSync(target_dir)) {
        fs.mkdirSync(target_dir);
    }

    const paths = swaggers.map(swagger => swagger.paths);
    const components = swaggers.map(swagger => swagger.components);

    let imports = "";
    let classTemplate = template_string;
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
                const args = `${parseArgsTypes(swaggerEndpoints[method].parameters ?? [])}`;
                const argsString = `${args ? "args : { " + args.trim() + " }" : ""}`;
                const {returnTypeOfApiCall, importStatement} = getReturnTypeOfApiCall(swaggerEndpoints[method]?.responses?? {});

                if(!imports.includes(importStatement)) imports += importStatement;

                classDefinition += `    static ${endpointName} = class {\n`
                    + `        static method: requestMethod = "${endpointMethod}";\n`
                    + `        static getUrl = (${argsString}) => \`${endpointUrl.replace(/{/g, "${args.")}\`;\n`
                    + `        static call = async (${argsString ? argsString + ", " : ""}data?: any, onError?: false | ((error: any) => void)) : Promise<AxiosResponse<${returnTypeOfApiCall}, any>> => {\n`
                    + `            const url = new URL(this.getUrl(${argsString ? "args" : ""}), baseUrl).toString();\n`
                    + `            return await CallApi<${returnTypeOfApiCall}>(url, this.method, data, onError);\n`
                    + `        }\n`
                    + `    }\n`;
            }
        }
    }

    let result = imports + "\n" + classTemplate.replace("// <<< the endpoints will be generated here >>>", classDefinition);
    fs.writeFileSync(path.join(target_dir, `endpoints.ts`), result);

    generateTypeScriptInterfacesForDtoModels(path.join(target_dir, "models"), ...components);
}

function parseArgsTypes(parameters: any[]) {
    let args = "";
    for (const parameter of parameters) {
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

function generateTypeScriptInterfacesForDtoModels(modelsDir: string, ...components: any[]) {
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir);
    }

    for (const component of components) {
        const typeMap: any = {};

        for (const [name, schema] of Object.entries(component.schemas)) {
            const interfaceName = name[0].toUpperCase() + name.slice(1);
            let interfaceString = `export interface ${interfaceName} {\n`;
            let importStatements = '';

            const properties: any = (schema as any).properties;
            for (const [propertyName, property_] of Object.entries(properties)) {
                const property = property_ as any;
                let propertyType = property.type;
                const items = property.items;

                if (propertyType === 'integer') {
                    propertyType = 'number';
                } else if (propertyType === 'array') {
                    if (items.$ref) {
                        const ref = items.$ref.split('/').pop();
                        propertyType = `${ref[0].toUpperCase() + ref.slice(1)}[]`;
                        typeMap[ref] = interfaceName;
                        importStatements += `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                    } else if (items.type === 'integer') {
                        propertyType = 'number[]';
                    } else {
                        propertyType = `${items.type}[]`;
                    }
                } else if (propertyType === 'object' && property.$ref) {
                    const ref = property.$ref.split('/').pop();
                    propertyType = ref[0].toUpperCase() + ref.slice(1);
                    typeMap[ref] = interfaceName;
                    importStatements += `import { ${ref[0].slice(1)} } from './${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                }
                const required = (schema as any).required?.includes(propertyName);
                interfaceString += `  ${propertyName}${required ? '' : '?'}: ${propertyType};\n`;
            }

            interfaceString += '}\n';
            fs.writeFileSync(path.join(modelsDir, `${interfaceName}.ts`), importStatements + interfaceString);
        }

        for (const [name, _] of Object.entries(component.schemas)) {
            const interfaceName = name[0].toUpperCase() + name.slice(1);
            let interfaceString = fs.readFileSync(path.join(modelsDir, `${interfaceName}.ts`), 'utf8');
            interfaceString = interfaceString.replace(new RegExp(`(\\w+)\\s*?:\\s*?${name}`, 'g'), `$1: ${interfaceName}`);
            fs.writeFileSync(path.join(modelsDir, `${interfaceName}.ts`), interfaceString);
        }
    }
}

const getReturnTypeOfApiCall = (responses: any) => {
    let importStatement = '';
    const response = responses["200"] ?? responses["201"] ?? responses["204"] ?? null;
    if (response?.content) {
        const schema:any = response?.content['application/json'].schema;
        if (schema.$ref) {
            const ref = schema.$ref.split('/').pop();
            const retType = ref[0].toUpperCase() + ref.slice(1);
            importStatement = `import { ${retType} } from './models/${retType}';\n`;
            return {returnTypeOfApiCall: retType, importStatement};
        } else if (schema.type === 'array') {
            const items = schema.items;
            if (items.$ref) {
                const ref = items.$ref.split('/').pop();
                const retType = `${ref[0].toUpperCase() + ref.slice(1)}[]`;
                importStatement = `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './models/${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                return {returnTypeOfApiCall: retType, importStatement};
            } else if (items.type === 'integer') {
                return {returnTypeOfApiCall: 'number[]', importStatement};
            } else {
                return {returnTypeOfApiCall: `${items.type}[]`, importStatement};
            }
        } else if (schema.type === 'integer') {
            return {returnTypeOfApiCall: 'number', importStatement};
        } else {
            return {returnTypeOfApiCall: schema.type, importStatement};
        }
    }
    return {returnTypeOfApiCall: 'void', importStatement};
}

const template_string: string = `// This file is generated using automated tool provided by NightmareGaurav (https://github.com/nightmaregaurav)
// Do not edit this file manually except for the lines annotated with a comment that ask you to fill in some details.

import axios, {AxiosRequestConfig, AxiosResponse, Method} from "axios";

// Fill the import statements that provides the relevant functions.
// getBearerToken() should take no arguments and should return a string containing the bearer token.
// goToLoginPage() should neither take any arguments nor return any value but should redirect the user to the login page.
import {getBearerToken, goToLoginPage} from "";

// Fill the value with the base url of the API.
export const baseUrl: string = "";

export type requestMethod = "GET" | "POST" | "PUT" | "DELETE";

async function CallApi<TResponse>(url: string, method: string, data?: any, onError?: false | ((error: any) => void)) : Promise<AxiosResponse<TResponse, any>> {
    const token = getBearerToken();
    const headers = {'Authorization': \`Bearer ${"${token}"}\`}

    const apiCallData: AxiosRequestConfig = {
        method: method as Method,
        url: url,
        data: data,
        headers: headers
    };
    const axiosInstance = axios.create({baseURL: baseUrl})
    axiosInstance.interceptors.response.use((r: any) => r, (error: any) => (401 === error?.response?.status) ? goToLoginPage() : Promise.reject(error));

    return await axiosInstance.request<TResponse>(apiCallData).catch((error: any) => {
        if (onError) onError(error);
        return error?.response;
    });
}

export class endpoints {
// <<< the endpoints will be generated here >>>}

`;

// Usage Example
// import swagger from './swagger.json';
// createEndpointsAndModels("./endpoints", swagger);