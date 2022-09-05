import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { NotFoundError } from '@unocha/hpc-api-core/src/util/error';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class FlowService {
  async findLatestVersionById(
    models: Database,
    id: number
  ): Promise<{ id: FlowId; name?: string | null }> {
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
}
