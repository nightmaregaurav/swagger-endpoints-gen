import {ModelDefinition} from "./ModelDefinition";
import {OpenApiMimeType} from "./enums/OpenApiMimeType";
import {HttpMethod} from "./enums/HttpMethod";
import {HttpResponseCode} from "./enums/HttpResponseCode";
import {OpenApiParameterLocation} from "./enums/OpenApiParameterLocation";

export interface ApiOperationObject {
    tags: string
    parameters?: ParameterDefinition[]
    requestBody?: RequestBodyDefinition
    responses?: ResponseBasedOnHttpResponseCodeDefinitionObjectType
    summary?: string
    description?: string
    deprecated?: boolean
    consumes?: OpenApiMimeType
    produces?: OpenApiMimeType
}

export type QueryPathFormDataParameterDefinition = ModelDefinition & {
    in: OpenApiParameterLocation.Path | OpenApiParameterLocation.Query | OpenApiParameterLocation.FormData
    name: string
    description?: string
    required?: boolean
}

export type BodyParameterDefinition = {
    in: OpenApiParameterLocation.Body
    name: string
    description?: string
    required?: boolean
    schema: ModelDefinition
}

export type ParameterDefinition = QueryPathFormDataParameterDefinition | BodyParameterDefinition

export interface RequestBodyDefinition {
    description?: string
    required?: boolean
    content: RequestBasedOnMimeTypeDefinitionObjectType
}

export interface ResponseDefinition {
    description?: string
    schema: ModelDefinition
}

export type PathHttpMethodDefinitions = { [path: string] : PathHttpMethodDefinitionObjectType }
export type PathHttpMethodDefinitionObjectType = { [httpMethod in HttpMethod] : ApiOperationObject }
export type RequestBasedOnMimeTypeDefinitionObjectType = { [mimeType in OpenApiMimeType] : { schema: ModelDefinition } }
export type ResponseBasedOnHttpResponseCodeDefinitionObjectType = { [httpResponseCode in HttpResponseCode] : ResponseDefinition }
