"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEndpointsAndModels = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function createEndpointsAndModels(target_dir, ...swaggers) {
    var _a, _b, _c, _d, _e, _f, _g;
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
                let prefix = (_a = swaggerEndpoints[method].tags[0]) !== null && _a !== void 0 ? _a : "API";
                let endpointName = `${prefix}__${method}_${endpointUrl
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .replace(/_{3,}/g, "__")
                    .replace(/_+$/g, "")
                    .toLowerCase()}`;
                let endpointMethod = method.toUpperCase();
                const args = `${parseParamTypes((_b = swaggerEndpoints[method].parameters) !== null && _b !== void 0 ? _b : [], "path")}`;
                const argsString = `${args ? "args: { " + args.trim() + " }" : ""}`;
                const queryArgs = `${parseParamTypes((_c = swaggerEndpoints[method].parameters) !== null && _c !== void 0 ? _c : [], "query")}`;
                const queryArgsString = `${queryArgs ? "data: { " + queryArgs.trim() + " }" : ""}`;
                const { dataType: reqTypeOfApiCall, importStatement: reqImportStatement, isNullable: reqIsNullable } = getReqResTypeOfApiCall((_e = (_d = swaggerEndpoints[method]) === null || _d === void 0 ? void 0 : _d.requestBody) !== null && _e !== void 0 ? _e : {});
                const { dataType: returnTypeOfApiCall, importStatement: resImportStatement, isNullable: resIsNullable } = getReqResTypeOfApiCall((_g = (_f = swaggerEndpoints[method]) === null || _f === void 0 ? void 0 : _f.responses) !== null && _g !== void 0 ? _g : {});
                const callDataParam = reqTypeOfApiCall == "void" ? queryArgsString === "" ? "" : queryArgsString : `data${reqIsNullable ? "?" : ""}: ${reqTypeOfApiCall}`;
                const resDataType = returnTypeOfApiCall == "void" ? "void" : `${returnTypeOfApiCall}${resIsNullable ? " | null | undefined" : ""}`;
                if (!imports.includes(reqImportStatement))
                    imports += reqImportStatement;
                if (!imports.includes(resImportStatement))
                    imports += resImportStatement;
                classDefinition += `    static ${endpointName} = class {\n`
                    + `        static method: requestMethod = "${endpointMethod}";\n`
                    + `        static getUrl = (${argsString}) => \`${endpointUrl.replace(/{/g, "${args.")}\`;\n`
                    + `        static call = async (${argsString ? argsString + ", " : ""}${callDataParam === "" ? "" : callDataParam + ", "}onError?: false | ((error: any) => void)) : Promise<AxiosResponse<${resDataType}, any>> => {\n`
                    + `            const url = new URL(this.getUrl(${argsString ? "args" : ""}), baseUrl).toString();\n`
                    + `            return await CallApi<${resDataType}>(url, this.method,${callDataParam === "" ? "" : " data,"} onError);\n`
                    + `        }\n`
                    + `    }\n`;
            }
        }
    }
    let result = imports + "\n" + classTemplate.replace("// <<< the endpoints will be generated here >>>", classDefinition);
    fs.writeFileSync(path.join(target_dir, `endpoints.ts`), result);
    generateTypeScriptInterfacesForDtoModels(path.join(target_dir, "models"), ...components);
}
exports.createEndpointsAndModels = createEndpointsAndModels;
function parseParamTypes(parameters, paramType) {
    let args = "";
    for (const parameter of parameters) {
        if (paramType === "query" && parameter.in === "path")
            continue;
        if (paramType === "path" && parameter.in === "query")
            continue;
        let type = parameter.schema.type;
        if (type === "integer") {
            type = "number";
        }
        else if (type === "array") {
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
function generateTypeScriptInterfacesForDtoModels(modelsDir, ...components) {
    var _a;
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir);
    }
    for (const component of components) {
        const typeMap = {};
        for (const [name, schema] of Object.entries(component.schemas)) {
            const interfaceName = name[0].toUpperCase() + name.slice(1);
            let interfaceString = `export interface ${interfaceName} {\n`;
            let importStatements = '';
            const properties = schema.properties;
            for (const [propertyName, property_] of Object.entries(properties)) {
                const property = property_;
                let propertyType = property.type;
                const items = property.items;
                if (propertyType === 'integer') {
                    propertyType = 'number';
                }
                else if (propertyType === 'array') {
                    if (items.$ref) {
                        const ref = items.$ref.split('/').pop();
                        propertyType = `${ref[0].toUpperCase() + ref.slice(1)}[]`;
                        typeMap[ref] = interfaceName;
                        importStatements += `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                    }
                    else if (items.type === 'integer') {
                        propertyType = 'number[]';
                    }
                    else {
                        propertyType = `${items.type}[]`;
                    }
                }
                else if (propertyType === 'object' && property.$ref) {
                    const ref = property.$ref.split('/').pop();
                    propertyType = ref[0].toUpperCase() + ref.slice(1);
                    typeMap[ref] = interfaceName;
                    importStatements += `import { ${ref[0].slice(1)} } from './${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                }
                const required = (_a = schema.required) === null || _a === void 0 ? void 0 : _a.includes(propertyName);
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
const getReqResTypeOfApiCall = (reqsRes) => {
    var _a, _b, _c, _d, _e;
    let importStatement = '';
    const response = (_c = (_b = (_a = reqsRes["200"]) !== null && _a !== void 0 ? _a : reqsRes["201"]) !== null && _b !== void 0 ? _b : reqsRes["204"]) !== null && _c !== void 0 ? _c : reqsRes;
    if (response === null || response === void 0 ? void 0 : response.content) {
        const schema = (_e = (_d = response === null || response === void 0 ? void 0 : response.content) === null || _d === void 0 ? void 0 : _d['application/json']) === null || _e === void 0 ? void 0 : _e.schema;
        if (!schema)
            return { dataType: "any", importStatement: "", isNullable: false };
        if (schema.$ref) {
            const ref = schema.$ref.split('/').pop();
            const retType = `${ref[0].toUpperCase() + ref.slice(1)}`;
            importStatement = `import { ${retType} } from './models/${retType}';\n`;
            return { dataType: retType, importStatement, isNullable: schema.nullable };
        }
        else if (schema.type === 'array') {
            const items = schema.items;
            if (items.$ref) {
                const ref = items.$ref.split('/').pop();
                const retType = `${ref[0].toUpperCase() + ref.slice(1)}[]`;
                importStatement = `import { ${ref[0].toUpperCase() + ref.slice(1)} } from './models/${ref[0].toUpperCase() + ref.slice(1)}';\n`;
                return { dataType: retType, importStatement, isNullable: schema.nullable };
            }
            else if (items.type === 'integer') {
                const retType = `number[]`;
                return { dataType: retType, importStatement, isNullable: schema.nullable };
            }
            else {
                const retType = `${items.type}[]`;
                return { dataType: retType, importStatement, isNullable: schema.nullable };
            }
        }
        else if (schema.type === 'integer') {
            return { dataType: 'number', importStatement, isNullable: schema.nullable };
        }
        else {
            return { dataType: schema.type, importStatement, isNullable: schema.nullable };
        }
    }
    return { dataType: 'void', importStatement, isNullable: false };
};
const template_string = `// This file is generated using automated tool provided by NightmareGaurav (https://github.com/nightmaregaurav)
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
// import swagger1 from './swagger1.json';
// import swagger2 from './swagger2.json';
// import swagger3 from './swagger3.json';
// createEndpointsAndModels("./endpoints", swagger, swagger1, swagger2, swagger3);
//# sourceMappingURL=index.js.map