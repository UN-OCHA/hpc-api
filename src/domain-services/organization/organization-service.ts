import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class OrganizationService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['organization']>> {
    const organization = await models.organization.get(createBrandedValue(id));

    if (!organization) {
      throw new Error(`Organization with ID ${id} does not exist`);
    }

    return organization;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<InstanceDataOfModel<Database['organization']>[]> {
    return await models.organization.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });
  }
}
