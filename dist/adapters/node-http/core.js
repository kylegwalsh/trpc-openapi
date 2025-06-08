"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenApiNodeHttpHandler = void 0;
const server_1 = require("@trpc/server");
const http_1 = require("@trpc/server/http");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const generator_1 = require("../../generator");
const method_1 = require("../../utils/method");
const path_1 = require("../../utils/path");
const procedure_1 = require("../../utils/procedure");
const zod_1 = require("../../utils/zod");
const errors_1 = require("./errors");
const input_1 = require("./input");
const procedures_1 = require("./procedures");
function headersToRecord(headers) {
    const result = {};
    if (headers instanceof Headers) {
        // For Headers (fetch API style)
        headers.forEach((value, key) => {
            result[key] = value;
        });
    }
    else {
        // For HTTPHeaders (plain object style)
        Object.entries(headers).forEach(([key, value]) => {
            result[key] = String(value); // Ensure value is coerced to string
        });
    }
    return result;
}
const createOpenApiNodeHttpHandler = (opts) => {
    const router = (0, lodash_clonedeep_1.default)(opts.router);
    // Validate router
    if (process.env.NODE_ENV !== 'production') {
        (0, generator_1.generateOpenApiDocument)(router, { title: '', version: '', baseUrl: '' });
    }
    const { createContext, responseMeta, onError, maxBodySize } = opts;
    const getProcedure = (0, procedures_1.createProcedureCache)(router);
    return async (req, res, next) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const sendResponse = (statusCode, headers, body) => {
            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');
            for (const [key, value] of Object.entries(headers)) {
                if (typeof value !== 'undefined') {
                    res.setHeader(key, value);
                }
            }
            res.end(JSON.stringify(body));
        };
        const method = req.method;
        const reqUrl = req.url;
        const url = new URL(reqUrl.startsWith('/') ? `http://127.0.0.1${reqUrl}` : reqUrl);
        const path = (0, path_1.normalizePath)(url.pathname);
        const { procedure, pathInput } = (_a = getProcedure(method, path)) !== null && _a !== void 0 ? _a : {};
        let input = undefined;
        let ctx = undefined;
        let data = undefined;
        try {
            if (!procedure) {
                if (next) {
                    return next();
                }
                if (method === 'HEAD') {
                    sendResponse(204, {}, undefined);
                    return;
                }
                throw new server_1.TRPCError({
                    message: 'Not found',
                    code: 'NOT_FOUND',
                });
            }
            const useBody = (0, method_1.acceptsRequestBody)(method);
            const schema = (0, procedure_1.getInputOutputParsers)(procedure.procedure).inputParser;
            const unwrappedSchema = (0, zod_1.unwrapZodType)(schema, true);
            if (!(0, zod_1.instanceofZodTypeLikeVoid)(unwrappedSchema)) {
                const bodyOrQuery = useBody ? await (0, input_1.getBody)(req, maxBodySize) : (0, input_1.getQuery)(req, url);
                if ((0, zod_1.instanceofZodTypeArray)(unwrappedSchema)) {
                    // Input schema is an array
                    if (!Array.isArray(bodyOrQuery)) {
                        throw new server_1.TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Expected array in request body',
                        });
                    }
                    input = bodyOrQuery;
                }
                else {
                    // Input schema is an object or other type
                    input = Object.assign(Object.assign({}, bodyOrQuery), pathInput);
                }
            }
            if (zod_1.zodSupportsCoerce) {
                if ((0, zod_1.instanceofZodTypeObject)(unwrappedSchema)) {
                    const shapeSchemas = Object.values(unwrappedSchema.shape);
                    shapeSchemas.forEach((shapeSchema) => {
                        const unwrappedShapeSchema = (0, zod_1.unwrapZodType)(shapeSchema, false);
                        if ((0, zod_1.instanceofZodTypeCoercible)(unwrappedShapeSchema)) {
                            unwrappedShapeSchema._def.coerce = true;
                        }
                    });
                }
                else if ((0, zod_1.instanceofZodTypeArray)(unwrappedSchema)) {
                    // Handle coercion for array items
                    const itemSchema = unwrappedSchema._def.type;
                    const unwrappedItemSchema = (0, zod_1.unwrapZodType)(itemSchema, false);
                    if ((0, zod_1.instanceofZodTypeCoercible)(unwrappedItemSchema)) {
                        unwrappedItemSchema._def.coerce = true;
                    }
                }
            }
            ctx = await (createContext === null || createContext === void 0 ? void 0 : createContext({
                req,
                res,
                info: {}, // Ensure TRPCRequestInfo is provided
            }));
            const caller = router.createCaller(ctx);
            const segments = (_b = procedure === null || procedure === void 0 ? void 0 : procedure.path.split('.')) !== null && _b !== void 0 ? _b : [];
            const procedureFn = segments.reduce((acc, curr) => acc[curr], caller);
            if (!procedureFn) {
                throw new server_1.TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Procedure not found',
                });
            }
            data = await procedureFn(input);
            const meta = responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta({
                type: procedure.type,
                paths: [procedure.path],
                ctx,
                data: [data],
                errors: [],
                info: {}, // Provide TRPCRequestInfo
                eagerGeneration: false, // Set eagerGeneration flag
            });
            const statusCode = (_c = meta === null || meta === void 0 ? void 0 : meta.status) !== null && _c !== void 0 ? _c : 200;
            const headers = (_d = meta === null || meta === void 0 ? void 0 : meta.headers) !== null && _d !== void 0 ? _d : {};
            const body = data;
            sendResponse(statusCode, headersToRecord(headers), body);
        }
        catch (cause) {
            const error = (0, errors_1.getErrorFromUnknown)(cause);
            onError === null || onError === void 0 ? void 0 : onError({
                error,
                type: (_e = procedure === null || procedure === void 0 ? void 0 : procedure.type) !== null && _e !== void 0 ? _e : 'unknown',
                path: procedure === null || procedure === void 0 ? void 0 : procedure.path,
                input,
                ctx,
                req,
            });
            const meta = responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta({
                type: (_f = procedure === null || procedure === void 0 ? void 0 : procedure.type) !== null && _f !== void 0 ? _f : 'unknown',
                paths: (procedure === null || procedure === void 0 ? void 0 : procedure.path) ? [procedure === null || procedure === void 0 ? void 0 : procedure.path] : undefined,
                ctx,
                data: [data],
                errors: [error],
                eagerGeneration: false,
                info: {}, // Ensure TRPCRequestInfo is provided
            });
            const errorShape = (_g = (0, server_1.getErrorShape)({
                config: opts.router._def._config,
                error,
                type: 'unknown',
                path,
                input: undefined,
                ctx: undefined,
            })) !== null && _g !== void 0 ? _g : {
                message: (_h = error.message) !== null && _h !== void 0 ? _h : 'An error occurred',
                code: error.code,
            };
            const isInputValidationError = error.code === 'BAD_REQUEST' &&
                error.cause instanceof Error &&
                error.cause.name === 'ZodError';
            const statusCode = (_k = (_j = meta === null || meta === void 0 ? void 0 : meta.status) !== null && _j !== void 0 ? _j : (0, http_1.getHTTPStatusCodeFromError)(error)) !== null && _k !== void 0 ? _k : 500;
            const headers = (_l = meta === null || meta === void 0 ? void 0 : meta.headers) !== null && _l !== void 0 ? _l : {};
            const body = {
                message: isInputValidationError
                    ? 'Input validation failed'
                    : (_o = (_m = errorShape === null || errorShape === void 0 ? void 0 : errorShape.message) !== null && _m !== void 0 ? _m : error.message) !== null && _o !== void 0 ? _o : 'An error occurred',
                code: error.code,
                issues: isInputValidationError ? error.cause.errors : undefined,
            };
            sendResponse(statusCode, headersToRecord(headers), body);
        }
    };
};
exports.createOpenApiNodeHttpHandler = createOpenApiNodeHttpHandler;
//# sourceMappingURL=core.js.map