export type GeneratorOptions = {
    outDir: string;
    namespace: string;
    swaggerUrl: string;
    removeComments: boolean;
    getBearerTokenImportPath: string;
    middlewaresImportPath: string;
    baseUrl?: string;
}
