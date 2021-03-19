import { Field, ObjectType } from 'type-graphql';
import VersionModel from './common/VersionModel';
import ReportingWindow, { REPORTING_WINDOW_DATA } from './ReportingWindow';

@ObjectType()
export default class ReportingWindowVersion extends VersionModel<REPORTING_WINDOW_DATA> {

    @Field(() => ReportingWindow, { nullable: true })
    rootInst?: ReportingWindow;
}