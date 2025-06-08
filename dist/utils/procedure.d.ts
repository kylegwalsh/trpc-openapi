import { ProcedureType } from '@trpc/server';
import { AnyZodObject } from 'zod';
import { OpenApiMeta, OpenApiProcedure, OpenApiProcedureRecord } from '../types';
export declare const getInputOutputParsers: (procedure: OpenApiProcedure) => {
    inputParser: AnyZodObject | import("@trpc/server/unstable-core-do-not-import").Parser | undefined;
    outputParser: import("@trpc/server/unstable-core-do-not-import").Parser | undefined;
};
export declare const forEachOpenApiProcedure: (procedureRecord: OpenApiProcedureRecord, callback: (values: {
    path: string;
    type: ProcedureType;
    procedure: OpenApiProcedure;
    openapi: NonNullable<OpenApiMeta["openapi"]>;
}) => void) => void;
//# sourceMappingURL=procedure.d.ts.map