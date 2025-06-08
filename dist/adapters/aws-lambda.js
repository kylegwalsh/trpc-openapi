"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenApiAwsLambdaHandler = void 0;
const querystring = __importStar(require("querystring"));
const events_1 = require("events");
const node_mocks_http_1 = require("node-mocks-http");
const server_1 = require("@trpc/server");
const http_1 = require("@trpc/server/http");
const core_1 = require("./node-http/core");
const errors_1 = require("./node-http/errors");
// Assume payload format is determined by inspecting version directly in the event
function determinePayloadFormat(event) {
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
    // According to AWS support, version is is extracted from the version property in the event.
    // If there is no version property, then the version is implied as 1.0
    const unknownEvent = event;
    if (typeof unknownEvent.version === 'undefined') {
        return '1.0';
    }
    else {
        return unknownEvent.version;
    }
}
// Create simplified mock for the Lambda event
const createMockNodeHTTPRequest = (path, event) => {
    var _a;
    const url = event.path || event.rawPath || '/';
    const method = (event.httpMethod || event.requestContext.http.method || 'GET').toUpperCase();
    let body;
    const contentType = event.headers[(_a = Object.keys(event.headers).find((key) => key.toLowerCase() === 'content-type')) !== null && _a !== void 0 ? _a : ''];
    if (contentType === 'application/json') {
        try {
            body = event.body ? JSON.parse(event.body) : undefined;
        }
        catch (cause) {
            throw new server_1.TRPCError({
                message: 'Failed to parse request body',
                code: 'PARSE_ERROR',
                cause,
            });
        }
    }
    else if (contentType === 'application/x-www-form-urlencoded') {
        try {
            // Parse URL-encoded form data
            body = event.body ? querystring.parse(event.body) : undefined;
        }
        catch (cause) {
            throw new server_1.TRPCError({
                message: 'Failed to parse request body',
                code: 'PARSE_ERROR',
                cause,
            });
        }
    }
    return (0, node_mocks_http_1.createRequest)({
        url,
        method,
        query: event.queryStringParameters || undefined,
        headers: event.headers,
        body,
    });
};
const createMockNodeHTTPResponse = () => {
    return (0, node_mocks_http_1.createResponse)({ eventEmitter: events_1.EventEmitter });
};
const createOpenApiAwsLambdaHandler = (opts) => {
    return async (event, context) => {
        var _a, _b, _c, _d, _e, _f, _g;
        let path;
        try {
            const version = determinePayloadFormat(event);
            if (version !== '1.0' && version !== '2.0') {
                throw new server_1.TRPCError({
                    message: `Unsupported payload format version: ${version}`,
                    code: 'INTERNAL_SERVER_ERROR',
                });
            }
            const createContext = async () => {
                var _a;
                return (_a = opts.createContext) === null || _a === void 0 ? void 0 : _a.call(opts, {
                    event,
                    context,
                    info: {}, // Ensure 'info' is provided
                });
            };
            const openApiHttpHandler = (0, core_1.createOpenApiNodeHttpHandler)(Object.assign(Object.assign({}, opts), { createContext }));
            // Assume we can directly use the event path or default
            path = event.path || event.rawPath || '/';
            const req = createMockNodeHTTPRequest(path, event);
            const res = createMockNodeHTTPResponse();
            await openApiHttpHandler(req, res);
            return {
                statusCode: res.statusCode,
                headers: res.getHeaders(),
                body: res._getData(),
            };
        }
        catch (cause) {
            const error = (0, errors_1.getErrorFromUnknown)(cause);
            (_a = opts.onError) === null || _a === void 0 ? void 0 : _a.call(opts, {
                error,
                type: 'unknown',
                path,
                input: undefined,
                ctx: undefined,
                req: event,
            });
            const meta = (_b = opts.responseMeta) === null || _b === void 0 ? void 0 : _b.call(opts, {
                type: 'unknown',
                paths: [path],
                ctx: undefined,
                data: [undefined],
                errors: [error],
                info: {}, // Provide a valid TRPCRequestInfo
                eagerGeneration: false, // Set the eagerGeneration flag
            });
            const errorShape = (0, server_1.getErrorShape)({
                config: opts.router._def._config,
                error,
                type: 'unknown',
                path,
                input: undefined,
                ctx: undefined,
            });
            const statusCode = (_d = (_c = meta === null || meta === void 0 ? void 0 : meta.status) !== null && _c !== void 0 ? _c : (0, http_1.getHTTPStatusCodeFromError)(error)) !== null && _d !== void 0 ? _d : 500;
            const headers = Object.assign({ 'content-type': 'application/json' }, ((_e = meta === null || meta === void 0 ? void 0 : meta.headers) !== null && _e !== void 0 ? _e : {}));
            const body = {
                message: (_g = (_f = errorShape === null || errorShape === void 0 ? void 0 : errorShape.message) !== null && _f !== void 0 ? _f : error.message) !== null && _g !== void 0 ? _g : 'An error occurred',
                code: error.code,
            };
            return {
                statusCode,
                headers,
                body: JSON.stringify(body),
            };
        }
    };
};
exports.createOpenApiAwsLambdaHandler = createOpenApiAwsLambdaHandler;
//# sourceMappingURL=aws-lambda.js.map