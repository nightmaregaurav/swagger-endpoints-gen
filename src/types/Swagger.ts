import {EnumModelPropertiesDefinition, ObjectModelPropertiesDefinition} from "./ModelDefinition";
import {PathHttpMethodDefinitions} from "./PathDefinition";

export interface SwaggerApiSpecification {
    swagger: SwaggerVersion
    info: OpenApiInfo
    paths: PathHttpMethodDefinitions
    definitions?: ObjectEnumModelDefinition
    components?: SwaggerComponent
    securityDefinitions: SwaggerSecurityDefinitions
    security: SwaggerSecurity[]
}

export type SwaggerVersion = string;

export interface OpenApiInfo {
    title: string
    version: string
    summary?: string
    description?: string
    termsOfService?: string
    contact?: OpenApiContact
    license?: OpenApiLicense
}

export interface OpenApiContact {
    name: string
    url?: string
    email?: string
}

export interface OpenApiLicense {
    name: string
    identifier?: string
    url?: string
}

export interface SwaggerComponent {
    schemas: ObjectEnumModelDefinition
}

export type ObjectEnumModelDefinition = { [key: string] : EnumModelPropertiesDefinition | ObjectModelPropertiesDefinition };

export interface SwaggerSecurityDefinitions {
    Bearer: SwaggerBearerTokenDefinition
}

export interface SwaggerBearerTokenDefinition {
    type: string
    name: string
    in: string
    description: string
}

export interface SwaggerSecurity {
    [key: string]: string[]
}
