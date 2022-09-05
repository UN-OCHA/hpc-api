import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { FlowService } from '../flow-service';
import { Flow } from './types';

@Service()
@Resolver(Flow)
export default class FlowResolver {
  constructor(private flowService: FlowService) {}

  @Query(() => Flow)
  async flow(@Arg('id') id: number, @Ctx() context: Context) {
    return await this.flowService.findLatestVersionById(context.models, id);
  }
}
