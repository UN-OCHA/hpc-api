import { registerEnumType } from 'type-graphql';

import VersionedModel from './common/VersionedModel';
import { Brand } from '../../utils/branding';
import { IBase } from './common/Base';
import db from '../index';

export enum belongsToType {
    global = 'global',
    operation = 'operation',
    operationCluster = 'operationCluster',
    plan = 'plan',
    governingEntity = 'governingEntity',
}

registerEnumType(belongsToType, {
    name: 'belongsToType',
    description: 'Belongs To Types',
});

export enum REPORTING_WINDOW_STATE {
    pending = 'pending',
    open = 'open',
    closed = 'closed'
}

export interface REPORTING_WINDOW_DATA {
    name: string;
    belongsTo: {
        type: belongsToType.global
    } | {
        type: belongsToType.operation,
        operation: number;
    },
    state: REPORTING_WINDOW_STATE
}

export interface IReportingWindow extends IBase {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'reportingWindow ID'
    >;
    belongsToType: belongsToType;
    belongsToId: number | null;
}

export type ICreateReportingWindow = Omit<IReportingWindow, 'id' | keyof IBase> & Partial<Pick<IReportingWindow, keyof IBase>>;
export type IUpdateReportingWindow = Partial<Omit<IReportingWindow, 'id'>>;

export default class ReportingWindow extends VersionedModel<REPORTING_WINDOW_DATA> implements IReportingWindow {

    public static TableName = 'reportingWindow';

    id: IReportingWindow['id'];
    belongsToType: IReportingWindow['belongsToType'];
    belongsToId: IReportingWindow['belongsToId'];

    constructor(data?: ICreateReportingWindow & Partial<Pick<IReportingWindow, 'id'>>) {
        super();
        this.id = data?.id;
        this.belongsToId = data?.belongsToId;
        this.belongsToType = data?.belongsToType;
    }

    getTableName() {
        return ReportingWindow.TableName;
    }

    async saveData(data: REPORTING_WINDOW_DATA, update = false) {
        this.belongsToId = data.belongsTo.type === 'operation'
        ? data.belongsTo.operation : undefined;
        this.belongsToType = data.belongsTo.type;
        this.updatedAt = new Date();

        if(update) {
            await db('reportingWindow').update({
                belongsToId: this.belongsToId,
                belongsToType: this.belongsToType,
                updatedAt: this.updatedAt
            }).where({
                id: this.id
            })
        } else {
            const [createdInstance] = await db('reportingWindow').insert({
                belongsToId: this.belongsToId,
                belongsToType: this.belongsToType
            }).returning('*');
            this.id = createdInstance.id;
        }
    }
}
