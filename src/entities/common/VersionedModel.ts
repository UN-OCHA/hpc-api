import Base from './Base';
import VersionModel from "./VersionModel";

export default abstract class VersionedModel<Data> extends Base {
    
    public abstract versionModelInstance: VersionModel<Data>;
}
