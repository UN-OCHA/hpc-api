import Participant from "../Participant";

export default abstract class VersionModel<Data> {
    root: number;
    modifiedBy: number;
    modifiedByParticipant: Participant;
    version: number;
    isLatest: boolean;
    data: Data;
    createdAt: Date;
    updatedAt: Date;
}