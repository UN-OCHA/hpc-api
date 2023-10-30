import { Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

@Service()
export class OrganizationService {
  async getFlowObjectOrganizations(organizationsFO: any[], models: Database) {
    const organizations = await models.organization.find({
      where: {
        id: {
          [Op.IN]: organizationsFO.map((orgFO) => orgFO.objectID),
        },
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      refDirection: organizationsFO.find((orgFO) => orgFO.objectID === org.id)
        .refDirection,
      name: org.name,
    }));
  }
}
