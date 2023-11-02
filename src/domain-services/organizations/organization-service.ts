import { Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

@Service()
export class OrganizationService {
  async getOrganizationsForFlows(organizationsFO: any[], models: Database) {
    const organizations = await models.organization.find({
      where: {
        id: {
          [Op.IN]: organizationsFO.map((orgFO) => orgFO.objectID),
        },
      },
    });

    const organizationsMap = new Map<number, any>();

    organizationsFO.forEach((orgFO) => {
      const flowId = orgFO.flowID;
      if (!organizationsMap.has(flowId)) {
        organizationsMap.set(flowId, []);
      }
      const organization = organizations.find(
        (org) => org.id === orgFO.objectID
      );

      if (!organization) {
        throw new Error(
          `Organization with ID ${orgFO.objectID} does not exist`
        );
      }
      organizationsMap.get(flowId)!.push(organization);
    });
    organizations.forEach((org) => {
      const refDirection = organizationsFO.find(
        (orgFO) => orgFO.objectID === org.id
      ).refDirection;

      organizationsMap.set(
        org.id.valueOf(),
        this.mapOrganizationsToOrganizationFlows(org, refDirection)
      );
    });

    return organizationsMap;
  }

  private mapOrganizationsToOrganizationFlows(
    organization: any,
    refDirection: any
  ) {
    return {
      id: organization.id,
      refDirection: refDirection,
      name: organization.name,
    };
  }
}
