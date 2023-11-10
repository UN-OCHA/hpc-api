import { Database } from "@unocha/hpc-api-core/src/db";
import { FlowSearchResult } from "../graphql/types";

export interface FlowSearchStrategy{
    search(flowConditions: Map<string, any>, orderBy: any, limit: number, cursorCondition: any, models: Database): Promise<FlowSearchResult>;
}