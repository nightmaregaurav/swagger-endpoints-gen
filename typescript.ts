import * as fs from "fs";
import * as path from "path";
import {GeneratorOptions} from "./types";

export async function createTypescriptEndpointsAndModels(options: GeneratorOptions) {
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
        + `        static call = async (${argsString ? argsString + ", " : ""}${callDataParam === "" ? "" : callDataParam + ", "}${queryArgsString === "" ? "" : queryArgsString + ", "}${!useCacheHelper ? "" : "cacheExpiry?: Date, "}onError?: false | ((error: AxiosError) => void)) : Promise<AxiosResponse<${resDataType}>> => {\n`
        + `            const url = new URL(this.getUrl(${argsString ? "args" : ""}), baseUrl).toString();\n`
        + `            return await CallApi<${resDataType}>(url, this.method, ${callDataParam === "" ? "undefined" : "data"}, ${queryArgsString === "" ? "undefined" : " params"}${!useCacheHelper ? "" : ", cacheExpiry"}, onError);\n`
        + `        }\n`
        + `    }\n`;
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





const fixImportedPropertyTypeInFilesCorrespondingToSchemas = (modelsDir: string, schemas: any) => {
    for (const [name, _] of Object.entries(schemas)) {
        if ((_ as any).enum !== undefined) continue;
        const interfaceName = name[0].toUpperCase() + name.slice(1);
        let interfaceString = fs.readFileSync(path.join(modelsDir, `${interfaceName}.ts`), 'utf8');
        interfaceString = interfaceString.replace(new RegExp(`(\\w+)\\s*?:\\s*?${name}`, 'g'), `$1: ${interfaceName}`);
        fs.writeFileSync(path.join(modelsDir, `${interfaceName}.ts`), interfaceString);
    }
}
