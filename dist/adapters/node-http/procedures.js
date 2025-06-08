"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProcedureCache = void 0;
const path_1 = require("../../utils/path");
const procedure_1 = require("../../utils/procedure");
const createProcedureCache = (router) => {
    const procedureCache = new Map();
    (0, procedure_1.forEachOpenApiProcedure)(router._def.procedures, ({ path: queryPath, procedure, openapi }) => {
        const { method } = openapi;
        if (!procedureCache.has(method)) {
            procedureCache.set(method, new Map());
        }
        const path = (0, path_1.normalizePath)(openapi.path);
        const pathRegExp = (0, path_1.getPathRegExp)(path);
        if (procedure._def.type === "mutation" || procedure._def.type === "query") {
            procedureCache.get(method).set(pathRegExp, {
                type: procedure._def.type,
                path: queryPath,
                procedure,
            });
        }
    });
    return (method, path) => {
        var _a, _b;
        const procedureMethodCache = procedureCache.get(method);
        if (!procedureMethodCache) {
            return undefined;
        }
        const procedureRegExp = Array.from(procedureMethodCache.keys()).find((re) => re.test(path));
        if (!procedureRegExp) {
            return undefined;
        }
        const procedure = procedureMethodCache.get(procedureRegExp);
        const pathInput = (_b = (_a = procedureRegExp.exec(path)) === null || _a === void 0 ? void 0 : _a.groups) !== null && _b !== void 0 ? _b : {};
        return { procedure, pathInput };
    };
};
exports.createProcedureCache = createProcedureCache;
//# sourceMappingURL=procedures.js.map