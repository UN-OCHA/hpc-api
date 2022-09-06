import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class UsageYearService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['usageYear']>> {
    const usageYear = await models.usageYear.get(createBrandedValue(id));

    if (!usageYear) {
      throw new Error(`Usage year with ID ${id} does not exist`);
    }

    return usageYear;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<InstanceDataOfModel<Database['usageYear']>[]> {
    return await models.usageYear.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });
  }
}
