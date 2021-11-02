import Context from '../../Context';
import Location from './types';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { LocationService } from '../location-service';
import { MinLength } from 'class-validator';
import { Service } from 'typedi';
import { Arg, Args, ArgsType, Ctx, Field, Query, Resolver } from 'type-graphql';

@ArgsType()
class SearchLocationsArgs {
  @Field()
  @MinLength(3)
  search: string;
}

@Service()
@Resolver(Location)
export default class LocationResolver {
  constructor(private locationService: LocationService) {}

  @Query(() => Location)
  async location(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['location']>> {
    return await this.locationService.findById(context.models, id);
  }

  @Query(() => [Location])
  async searchLocation(
    @Args() { search }: SearchLocationsArgs,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['location']>[]> {
    return await this.locationService.search(context.models, search);
  }
}
