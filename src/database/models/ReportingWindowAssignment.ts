import { registerEnumType } from 'type-graphql';

import VersionedModel from './common/VersionedModel';
import ReportingWindow from './ReportingWindow';
import { Brand } from '../../utils/branding';
import db from '../index';
import Base, { IBase } from './common/Base';

export enum AssigneeType {
    operation = 'operation',
    operationCluster = 'operationCluster'
}

registerEnumType(AssigneeType, {
    name: 'AssigneeType',
    description: 'Assignee Types',
});

export type REPORTING_WINDOW_ASSIGNMENT_STATE = null | {
    type: 'raw' | 'clean',
    finalized: boolean;
    data: string;
    files?: { name: string; data: {
        fileHash: string;
    }}[]
}

export interface REPORTING_WINDOW_ASSIGNMENT_DATA {
    reportingWindowId: number;
    assignee: {
        type: AssigneeType.operation,
        operation: number;
    } | {
        type: AssigneeType.operationCluster,
        cluster: number;
    };
    task: {
        type: 'form',
        form: number;
        formName: string;
        formVersion: number;
        state: REPORTING_WINDOW_ASSIGNMENT_STATE
    };
}

export interface IReportingWindowAssignment extends IBase {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'reportingWindowAssignment ID'
    >;
    assigneeType: AssigneeType;
    assigneeId: number;
    assigneeOperation: number;
    reportingWindowId: number;
}

export type ICreateReportingWindowAssignment = Omit<IReportingWindowAssignment, 'id' | keyof IBase> & Partial<Pick<IReportingWindowAssignment, keyof IBase>>;
export type IUpdateReportingWindowAssignment = Partial<Omit<IReportingWindowAssignment, 'id'>>;

export default class ReportingWindowAssignment extends VersionedModel<REPORTING_WINDOW_ASSIGNMENT_DATA> {

    public static TableName = 'reportingWindowAssignment';

    id: IReportingWindowAssignment['id'];
    assigneeType: IReportingWindowAssignment['assigneeType'];
    assigneeId: IReportingWindowAssignment['assigneeId'];
    assigneeOperation: IReportingWindowAssignment['assigneeOperation'];
    reportingWindowId: IReportingWindowAssignment['reportingWindowId'];

    constructor(data?: ICreateReportingWindowAssignment & Partial<Pick<IReportingWindowAssignment, 'id'>>) {
        super();
        this.id = data?.id;
        this.assigneeType = data?.assigneeType;
        this.assigneeId = data?.assigneeId;
        this.assigneeOperation = data?.assigneeOperation;
        this.reportingWindowId = data?.reportingWindowId;
    }


    reportingWindow?: ReportingWindow;

    getTableName() {
        return ReportingWindowAssignment.TableName;
    }

    async saveData(data: REPORTING_WINDOW_ASSIGNMENT_DATA, update = false) {

        let assigneeOperation: number;
        let assigneeId: number;
        if (data.assignee.type === 'operation') {
          assigneeOperation = data.assignee.operation;
          assigneeId = data.assignee.operation;
        } else if (data.assignee.type === 'operationCluster') {
          // to be replaced with logic for operation cluster
          throw new Error('Unsupported assignee type');
        } else {
          throw new Error('Unknown assignee type');
        }

        this.reportingWindowId = data.reportingWindowId;
        this.assigneeOperation = assigneeOperation;
        this.assigneeType = data.assignee.type;
        this.assigneeId = assigneeId;


        if(update) {
            await db('reportingWindowAssignment').update({
                assigneeType: this.assigneeType,
                assigneeId: this.assigneeId,
                assigneeOperation: this.assigneeOperation,
                reportingWindowId: this.reportingWindowId,
            }).where({
                id: this.id
            })
        } else {
            const [createdInstance] = await db('reportingWindowAssignment').insert({
                assigneeType: this.assigneeType,
                assigneeId: this.assigneeId,
                assigneeOperation: this.assigneeOperation,
                reportingWindowId: this.reportingWindowId,
            }).returning('*');
            this.id = createdInstance.id;
        }
    }

    static async findOne(whereObj: Partial<IReportingWindowAssignment>) {
        const rawResult = await Base.findOneGeneric(db('reportingWindowAssignment'), whereObj);
        return new ReportingWindowAssignment(rawResult);
    }

    static async findOneWithReportingWindow(whereObj: Partial<IReportingWindowAssignment>) {
        const rawResult = await Base.findOneGeneric(db('reportingWindowAssignment'), whereObj).innerJoin('reportingWindow', 'reportingWindow.id', '=', 'reportingWindowAssignment.reportingWindowId');
        const instance = new ReportingWindowAssignment(rawResult);
        instance.reportingWindow = new ReportingWindow(rawResult);
    }
}
