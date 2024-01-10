import {ModelType} from "./enums/ModelType";
import {IntegerFormat} from "./enums/IntegerFormat";
import {NumberFormat} from "./enums/NumberFormat";
import {StringFormat} from "./enums/StringFormat";
import {DateFormat} from "./enums/DateFormat";

export type ModelDefinition = ReferenceModelPropertiesDefinition
    | ArrayModelPropertiesDefinition
    | ObjectModelPropertiesDefinition
    | EnumModelPropertiesDefinition
    | IntegerModelPropertiesDefinition
    | NumberModelPropertiesDefinition
    | StringModelPropertiesDefinition
    | DateTimeModelPropertiesDefinition
    | BooleanModelPropertiesDefinition
    | FileModelPropertiesDefinition

interface BaseModelPropertiesDefinition {
    readOnly?: boolean
    writeOnly?: boolean
    nullable?: boolean
}

export interface ReferenceModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    $ref: string
}

export interface ArrayModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    type: ModelType.Array
    items: ModelDefinition
    minItems? : number
    maxItems? : number
    uniqueItems?: boolean
}

export interface ObjectModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    type: ModelType.Object
    properties: { [key: string]: ModelDefinition }
    required: string[]
    additionalProperties?: boolean
    minProperties?: number
    maxProperties?: number
}

export interface EnumModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    type: ModelType.String | ModelType.Integer
    enum: string[]
}

export interface IntegerModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    format?: IntegerFormat
    type: ModelType.Integer
    minimum?: number
    maximum?: number
    exclusiveMinimum?: boolean
    exclusiveMaximum?: boolean
    multipleOf?: number
}

export interface NumberModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    format?: NumberFormat
    type: ModelType.Number
    minimum?: number
    maximum?: number
    exclusiveMinimum?: boolean
    exclusiveMaximum?: boolean
    multipleOf?: number
}

export interface StringModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    format?: StringFormat
    type: ModelType.String
    minLength?: number
    maxLength?: number
    pattern?: string
}

export interface DateTimeModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    format: DateFormat
    type: ModelType.String
}

export interface BooleanModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    type: ModelType.Boolean
}

export interface FileModelPropertiesDefinition extends BaseModelPropertiesDefinition {
    type: ModelType.File
}
