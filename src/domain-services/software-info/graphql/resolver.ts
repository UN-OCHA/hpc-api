import SoftwareInfo from './types';
import { Service } from 'typedi';
import { Query, Resolver } from 'type-graphql';
import { SoftwareInfoService } from '../software-info-service';

@Service()
@Resolver(SoftwareInfo)
export default class SoftwareInfoResolver {
  constructor(private softwareInfoService: SoftwareInfoService) {}

  @Query(() => [SoftwareInfo])
  softwareInfo(): SoftwareInfo[] {
    return this.softwareInfoService.getSoftwareInfo();
  }
}
