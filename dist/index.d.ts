export type GeneratorOptions = {
    outDir: string;
    bearerTokenAndLoginRedirectImportPath: string | undefined;
    baseUrl: string | undefined;
    swaggers: any[] | undefined;
    swaggerUrls: string[] | undefined;
};
export declare function createEndpointsAndModels(options: GeneratorOptions): Promise<void>;
