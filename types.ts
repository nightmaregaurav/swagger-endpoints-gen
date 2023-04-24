export type GeneratorOptions = {
    outDir: string;
    bearerTokenImportPath?: string;
    successErrorMiddlewarePath?: string;
    cacheHelperPath?: string;
    baseUrl?: string;
    swaggers?: any[];
    swaggerUrls?: string[];
    removeComments?: boolean;
}
