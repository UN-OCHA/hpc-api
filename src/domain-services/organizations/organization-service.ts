import { type Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type EntityDirection } from '../base-types';
import { type FlowObject } from '../flow-object/model';
import { type Organization } from './graphql/types';

// Local type definitions to increase readability
type OrganizationModel = Database['organization'];
type OrganizationInstance = InstanceOfModel<OrganizationModel>;
@Service()
export class OrganizationService {
  async getOrganizationsForFlows(
    organizationsFO: FlowObject[],
    models: Database
  ) {
    const organizations: OrganizationInstance[] =
      await models.organization.find({
        where: {
          id: {
            [Op.IN]: organizationsFO.map((orgFO) =>
              createBrandedValue(orgFO.objectID)
            ),
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
        const organizationPerFlow = getOrCreate(
          organizationsMap,
          flowId,
          () => []
        );
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
          const flowOrganizations = getOrCreate(
            organizationsMap,
            flowId,
            () => []
          );
          flowOrganizations.push(organizationMapped);
          organizationsMap.set(flowId, flowOrganizations);
        }
      }
    }

    return organizationsMap;
  }

  private mapOrganizationsToOrganizationFlows(
    organization: OrganizationInstance,
    refDirection: EntityDirection
  ): Organization {
    return {
      id: organization.id,
      direction: refDirection,
      name: organization.name,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      abbreviation: organization.abbreviation,
      url: organization.url,
      parentID: organization.parentID?.valueOf() ?? null,
      nativeName: organization.nativeName,
      comments: organization.comments,
      collectiveInd: organization.collectiveInd,
      active: organization.active,
      newOrganizationId: organization.newOrganizationId?.valueOf() ?? null,
      verified: organization.verified,
      notes: organization.notes,
    };
  }
}
