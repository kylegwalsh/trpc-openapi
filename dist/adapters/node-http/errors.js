"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorFromUnknown = void 0;
const server_1 = require("@trpc/server");
const rpc_1 = require("@trpc/server/rpc");
const getErrorFromUnknown = (error) => {
    if (error instanceof Error && error.name === 'TRPCError') {
        return error;
    }
    const code = error.code;
    const errorToString = typeof error.toString === 'function' ? error.toString() : undefined;
    return new server_1.TRPCError({
        code: rpc_1.TRPC_ERROR_CODES_BY_KEY[code] ? code : 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error
            ? error.message
            : errorToString
                ? errorToString
                : 'Unknown error occurred',
    });
};
exports.getErrorFromUnknown = getErrorFromUnknown;
//# sourceMappingURL=errors.js.map