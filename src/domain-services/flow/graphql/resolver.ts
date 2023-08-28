import { groupBy } from 'lodash';
import {
  Arg,
  Args,
  ArgsType,
  Ctx,
  Field,
  FieldResolver,
  Query,
  Resolver,
  Root,
  Int,
} from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { FlowObjectService } from '../../flow-object/flow-object-service';
import { FlowService } from '../flow-service';
import { Flow, FlowFilters } from './types';

@ArgsType()
class SearchFlowsArgs {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field({ nullable: true })
  filters?: FlowFilters;
}

@Service()
@Resolver(Flow)
export default class FlowResolver {
  constructor(
    private flowService: FlowService,
    private flowObjectService: FlowObjectService
  ) {}

  @Query(() => [Flow])
  async searchFlow(@Args() params: SearchFlowsArgs, @Ctx() context: Context) {
    return await this.flowService.search(context.models, params);
  }

  @Query(() => Flow)
  async flow(@Arg('id') id: number, @Ctx() context: Context) {
    return await this.flowService.findLatestVersionById(context.models, id);
  }

  @FieldResolver()
  async createdBy(@Root() flow: Flow, @Ctx() context: Context) {
    return await this.flowService.findEndpointLogParticipant(
      context.models,
      flow.id
    );
  }

  @FieldResolver()
  async lastUpdatedBy(@Root() flow: Flow, @Ctx() context: Context) {
    return await this.flowService.findEndpointLogParticipant(
      context.models,
      flow.id,
      'updatedAt'
    );
  }

  @FieldResolver()
  async flowObjects(@Root() flow: Flow, @Ctx() context: Context) {
    const flowObjects = await this.flowObjectService.findByFlowId(
      context.models,
      flow.id
    );
    const { source, destination } = groupBy(flowObjects, 'refDirection');
    return {
      source: this.flowObjectService.groupByObjectType(context, source),
      destination: this.flowObjectService.groupByObjectType(
        context,
        destination
      ),
    };
  }
}
