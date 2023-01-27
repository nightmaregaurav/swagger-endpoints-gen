export type GeneratorOptions = {
    outDir: string;
    bearerTokenAndLoginRedirectImportPath?: string;
    baseUrl?: string;
    swaggers?: any[];
    swaggerUrls?: string[];
    removeComments?: boolean;
};
export declare function createEndpointsAndModels(options: GeneratorOptions): Promise<void>;
