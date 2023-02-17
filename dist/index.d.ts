export type GeneratorOptions = {
    outDir: string;
    bearerTokenImportPath?: string;
    successErrorMiddlewarePath?: string;
    baseUrl?: string;
    swaggers?: any[];
    swaggerUrls?: string[];
    removeComments?: boolean;
};
export declare function createEndpointsAndModels(options: GeneratorOptions): Promise<void>;
