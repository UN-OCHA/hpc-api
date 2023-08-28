import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { NotFoundError } from '@unocha/hpc-api-core/src/util/error';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowFilters } from './graphql/types';

@Service()
export class FlowService {
  async search(
    models: Database,
    params: {
      limit?: number;
      offset?: number;
      filters?: FlowFilters;
    }
  ): Promise<InstanceDataOfModel<Database['flow']>[]> {
    const { limit, offset, filters } = params;
    const findParams: {
      limit?: number;
      offset?: number;
      where?: any;
    } = {
      limit: limit || 100,
      offset: offset || 0,
    };
    if (filters) {
      findParams.where = filters;
    }
    return await models.flow.find({ ...findParams });
  }

  async findLatestVersionById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['flow']>> {
    const [flow] = await models.flow.find({
      where: {
        id: createBrandedValue(id),
      },
      orderBy: {
        column: 'versionID',
        order: 'desc',
      },
      limit: 1,
    });

    if (!flow) {
      throw new NotFoundError(`Flow with ID ${id} does not exist`);
    }

    return flow;
  }

  async findEndpointLogParticipant(
    models: Database,
    flowId: number,
    column: keyof InstanceDataOfModel<Database['endpointLog']> = 'createdAt'
  ): Promise<string | null> {
    const [endpointLog] = await models.endpointLog.find({
      where: {
        entityType: 'flow',
        entityId: flowId,
      },
      orderBy: {
        column: column,
        order: 'desc',
      },
      limit: 1,
    });

    if (!endpointLog) {
      return null;
    }

    const participant = await models.participant.findOne({
      where: {
        id: endpointLog.participantId,
      },
    });

    return participant?.name || null;
  }
}
