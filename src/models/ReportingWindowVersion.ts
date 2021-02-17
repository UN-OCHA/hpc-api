import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import VersionedModel from './common/VersionedModel';
import VersionModel from './common/VersionModel';
import ReportingWindow, { REPORTING_WINDOW_DATA } from './ReportingWindow';



@Entity({name: 'reportingWindowVersion' })
export default class ReportingWindowVersion extends VersionModel<REPORTING_WINDOW_DATA> {

    @ManyToOne(() => ReportingWindow, reportingWindow => reportingWindow.versions)
    @JoinColumn({name: 'root'})
    rootModel: VersionedModel<REPORTING_WINDOW_DATA>;
}