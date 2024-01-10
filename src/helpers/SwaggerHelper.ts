import {SwaggerApiSpecification} from "../types/Swagger";

export const getSwaggerJsonSpecificationFromUrl = async (url: string) => {
    const response = await fetch(url);
    return await response.json() as SwaggerApiSpecification;
}
