import path from "path";
import {humanizeCodeCase, isNullOrUndefinedOrWhitespace} from "./StringHelpers";
import {
    EnumModelPropertiesDefinition,
    ModelDefinition,
    ObjectModelPropertiesDefinition,
    ReferenceModelPropertiesDefinition,
} from "../types/ModelDefinition";
import {ObjectEnumModelDefinition} from "../types/Swagger";
import {createFileWithContent} from "./FileHelpers";
import {ModelType} from "../types/enums/ModelType";


export const generateSchemaDefinitions = (removeComment: boolean, modelsDir: string, schemas: ObjectEnumModelDefinition) => {
    if (Object.keys(schemas).length === 0) return;
    Object.entries(schemas).forEach(([name, schema]) => {
        if (![ModelType.Object, ModelType.String, ModelType.Integer].includes(schema.type)) {
            console.log(`Skipping ${name} because it's type ${schema.type} is not currently supported!`);
            return;
        }
        name = name[0].toUpperCase() + name.slice(1);
        const content = schema.type === ModelType.Object
            ? getInterfaceString(removeComment, name, schema as any as ObjectModelPropertiesDefinition, schemas)
            : getEnumString(removeComment, name, schema as any as EnumModelPropertiesDefinition);
        const filePath = schema.type === ModelType.Object
            ? path.join(modelsDir, `${name}.ts`)
            : path.join(modelsDir, `Enums`, `${name}.ts`);
        createFileWithContent(filePath, content);
    });
}

export const getEnumString = (removeComment: boolean, name: string, def: EnumModelPropertiesDefinition) => {
    let enumDefinition = `export enum ${name} {`;
    def.enum.forEach(enumValue => {
        if (def.type ==  ModelType.String) enumDefinition += `\n\t${enumValue} = "${humanizeCodeCase(enumValue)}",`
        else enumDefinition += `\n\tE_${enumValue} = ${enumValue},`
    });
    enumDefinition += `\n}`
    const comment = removeComment ? '' : ToolNotice;
    const finalString = `${comment}\n\n${enumDefinition}`.trim();
    return finalString + "\n";
}

export const getInterfaceString = (removeComment: boolean, name: string, def: ObjectModelPropertiesDefinition, schemas: ObjectEnumModelDefinition) => {
    let interfaceDefinition = `export interface ${name} {`;
    let importStatements = '';

    const properties = def.properties ?? {};
    Object.entries(properties).forEach(([key, modelDefinition]) => {
        const {importString, typeString} = getImportAndTypeStringFromModelDefinition(modelDefinition, schemas);
        const nullFlag = modelDefinition.nullable ? '?' : '';
        interfaceDefinition += `\n\t${key}${nullFlag}: ${typeString};`;
        if (!isNullOrUndefinedOrWhitespace(importString)) importStatements += `\n${importString}`;
    });
    if (def.additionalProperties) interfaceDefinition += `\n\t[key: string]: any;`
    interfaceDefinition += `\n}`;

    const comment = removeComment ? '' : ToolNotice;
    const finalString = `${comment}\n\n${importStatements.trim()}\n\n${interfaceDefinition}`.trim();
    return finalString + "\n";
}

export const getImportAndTypeStringFromModelDefinition = (def: ModelDefinition, schemas: ObjectEnumModelDefinition) => {
    const isReference = (def as Exclude<ModelDefinition, ReferenceModelPropertiesDefinition>).type == null && (def as ReferenceModelPropertiesDefinition).$ref != null;
    if (isReference) {
        const typedDef = def as ReferenceModelPropertiesDefinition;
        return getImportAndTypeStringFromReferenceModelPropertiesDefinition(typedDef, schemas);
    }

    const typedDef = def as Exclude<ModelDefinition, ReferenceModelPropertiesDefinition>;
    return getImportAndTypeStringFromModelPropertiesDefinition(typedDef, schemas);
}

export const getImportAndTypeStringFromReferenceModelPropertiesDefinition = (def: ReferenceModelPropertiesDefinition, schemas: ObjectEnumModelDefinition) => {
    const ref = def.$ref;
    const refName = ref.split('/').pop() ?? '';
    const refIsEnum = (schemas[ref].type === ModelType.String || schemas[ref].type === ModelType.Integer) && schemas[ref].type !== ModelType.Object;
    const typeString = refName[0].toUpperCase() + refName.slice(1);
    const importString = refIsEnum
        ? `import {${typeString}} from "./Enums/${typeString}";`
        : `import {${typeString}} from "./${typeString}";`;
    return {importString, typeString};
}

export const getImportAndTypeStringFromModelPropertiesDefinition = (def: Exclude<ModelDefinition, ReferenceModelPropertiesDefinition>, schemas: ObjectEnumModelDefinition) => {
    let importString = '';
    let typeString = '';

    const isArray = def.type === ModelType.Array;
    if (isArray) {
        const {importString: arrayImportString, typeString: arrayTypeString} = getImportAndTypeStringFromModelDefinition(def.items, schemas);
        importString += arrayImportString;
        typeString = `${arrayTypeString}[]`;
        return {importString, typeString};
    }

    const defType = def.type;
    switch (defType) {
        case ModelType.Object:
            typeString = `any`;
            break;
        case ModelType.String:
            typeString = 'string';
            break;
        case ModelType.Integer:
            typeString = 'number';
            break;
        case ModelType.Number:
            typeString = 'number';
            break;
        case ModelType.Boolean:
            typeString = 'boolean';
            break;
        case ModelType.File:
            typeString = 'File';
            importString = `import {File} from "node:buffer";`;
            break;
        default:
            throw new Error(`Unknown model type: ${defType}`);
    }
    return {importString, typeString};
}
