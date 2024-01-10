const ApiCallerService: string = `import axios, {AxiosError, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig, Method} from "axios";

// getBearerToken() should take no arguments and should return a string containing the bearer token.
import {getBearerToken} from "<<BEARER_TOKEN_IMPORT_PATH>>";

// preflightMiddleware() should take an InternalAxiosRequestConfig as an argument and should return either null or an InternalAxiosRequestConfig(returning InternalAxiosRequestConfig will change the request config).
// successMiddleware() should take an AxiosResponse as an argument and should return void.
// errorMiddleware() should take an AxiosError as an argument and should return void.
import {preflightMiddleware, successMiddleware, errorMiddleware} from "<<SUCCESS_ERROR_MIDDLEWARE_PATH>>";

// the base url of the API.
export const BASE_URL: string = "<<BASE_URL>>";


export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT";

async function CallApi<TResponse>(url: string, method: RequestMethod, data?: {}, queryParams?: {}, onError?: false | ((error: AxiosError) => void)) : Promise<AxiosResponse<TResponse>> {
    const token = getBearerToken();
    const headers = {'Authorization': "Bearer " + token}

    const apiCallData: AxiosRequestConfig = {
        method: method as Method,
        url: url,
        data: data,
        params: queryParams,
        headers: headers
    };
    const axiosInstance = axios.create({baseURL: BASE_URL})

    axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        let patchedConfig = preflightMiddleware(config);
        if (patchedConfig) config = patchedConfig;
        return config;
    }, (error: AxiosError) => {
        errorMiddleware(error);
        return Promise.reject(error);
    });

    axiosInstance.interceptors.response.use((response: AxiosResponse) => {
        successMiddleware(response);
        return response;
    }, (error: AxiosError) => {
        errorMiddleware(error);
        return Promise.reject(error);
    });

    return await axiosInstance.request<TResponse>(apiCallData).catch((error: AxiosError) => {
        if (onError) onError(error);
        throw error.response ?? "Error while making request!";
    });
}`;

const ApiDefinitionClass: string = `import {RequestMethod, CallApi} from "./ApiCallerService";

export default class endpoints {
<<< the endpoints will be generated here >>>
}`;
