import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import VersionedModel from './common/VersionedModel';
import VersionModel from './common/VersionModel';
import ReportingWindowAssignment, { REPORTING_WINDOW_ASSIGNMENT_DATA } from './ReportingWindowAssignment';



@Entity({name: 'reportingWindowAssignmentVersion' })
export default class ReportingWindowAssignmentVersion extends VersionModel<REPORTING_WINDOW_ASSIGNMENT_DATA> {

    @ManyToOne(() => ReportingWindowAssignment, reportingWindowAssignment => reportingWindowAssignment.versions)
    @JoinColumn({name: 'root'})
    rootModel: VersionedModel<REPORTING_WINDOW_ASSIGNMENT_DATA>;
}