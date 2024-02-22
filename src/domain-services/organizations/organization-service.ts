import { type Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { type Organization } from './graphql/types';

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

    const organizationsMap = new Map<number, Organization[]>();

    for (const orgFO of organizationsFO) {
      const flowId = orgFO.flowID;

      if (!organizationsMap.has(flowId)) {
        organizationsMap.set(flowId, []);
      }
      const organization = organizations.find(
        (org) => org.id === orgFO.objectID
      );

      if (organization) {
        const organizationPerFlow = organizationsMap.get(flowId)!;
        if (
          !organizationPerFlow.some(
            (org) =>
              org.id === organization.id.valueOf() &&
              org.direction === orgFO.refDirection
          )
        ) {
          const organizationMapped: Organization =
            this.mapOrganizationsToOrganizationFlows(
              organization,
              orgFO.refDirection
            );
          organizationsMap.get(flowId)!.push(organizationMapped);
        }
      }
    }

    return organizationsMap;
  }

  private mapOrganizationsToOrganizationFlows(
    organization: any,
    refDirection: any
  ): Organization {
    return {
      id: organization.id,
      direction: refDirection,
      name: organization.name,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      abbreviation: organization.abbreviation,
      url: organization.url,
      parentID: organization.parentID,
      nativeName: organization.nativeName,
      comments: organization.comments,
      collectiveInd: organization.collectiveInd,
      active: organization.active,
      newOrganisationId: organization.newOrganisationId,
      verified: organization.verified,
      notes: organization.notes,
    };
  }
}
