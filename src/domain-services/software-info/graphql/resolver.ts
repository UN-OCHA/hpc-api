import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import { SoftwareInfoService } from '../software-info-service';
import SoftwareInfo from './types';

@Service()
@Resolver(SoftwareInfo)
export default class SoftwareInfoResolver {
  constructor(private softwareInfoService: SoftwareInfoService) {}

  @Query(() => [SoftwareInfo])
  softwareInfo(): SoftwareInfo[] {
    return this.softwareInfoService.getSoftwareInfo();
  }
}
