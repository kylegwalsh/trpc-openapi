import type { APIGatewayProxyEvent, APIGatewayProxyEventV2, Context as APIGWContext } from 'aws-lambda';
import type { CreateOpenApiAwsLambdaHandlerOptions, OpenApiRouter } from '../types';
export declare const createOpenApiAwsLambdaHandler: <TRouter extends OpenApiRouter, TEvent extends APIGatewayProxyEvent | APIGatewayProxyEventV2>(opts: CreateOpenApiAwsLambdaHandlerOptions<TRouter, TEvent>) => (event: TEvent, context: APIGWContext) => Promise<{
    statusCode: number;
    headers: import("http").OutgoingHttpHeaders;
    body: any;
} | {
    statusCode: number;
    headers: {
        append(name: string, value: string): void;
        delete(name: string): void;
        get(name: string): string | null;
        getSetCookie(): string[];
        has(name: string): boolean;
        set(name: string, value: string): void;
        forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
        entries(): HeadersIterator<[string, string]>;
        keys(): HeadersIterator<string>;
        values(): HeadersIterator<string>;
        [Symbol.iterator](): HeadersIterator<[string, string]>;
        'content-type': string;
    } | {
        'content-type': string;
    };
    body: string;
}>;
//# sourceMappingURL=aws-lambda.d.ts.map