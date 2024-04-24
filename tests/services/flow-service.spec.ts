import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { type EntityDirection } from '../../src/domain-services/base-types';
import { FlowObjectService } from '../../src/domain-services/flow-object/flow-object-service';
import { type FlowObjectType } from '../../src/domain-services/flow-object/model';
import { FlowService } from '../../src/domain-services/flows/flow-service';
import { type FlowOrderByWithSubEntity } from '../../src/domain-services/flows/model';
import { buildOrderBy } from '../../src/domain-services/flows/strategy/impl/utils';
import ContextProvider from '../testContext';

const context = ContextProvider.Instance;

describe('Test flow service', () => {
  const externalReferences = [
    {
      systemID: 'CERF' as const,
      flowID: createBrandedValue(1),
      versionID: 1,
      externalRecordID: '-1234',
      externalRecordDate: new Date(),
    },
    {
      systemID: 'EDRIS' as const,
      flowID: createBrandedValue(3),
      versionID: 1,
      externalRecordID: '829634',
      externalRecordDate: new Date(),
    },
    {
      systemID: 'OCT' as const,
      flowID: createBrandedValue(2),
      versionID: 2,
      externalRecordID: '1234',
      externalRecordDate: new Date(),
    },
  ];

  const organizations = [
    { name: 'AAAA', abbreviation: 'A' },
    { name: 'CCCC', abbreviation: 'C' },
    { name: 'ZZZZ', abbreviation: 'Z' },
  ];
  const flowObjectsOrganizations = [
    {
      flowID: createBrandedValue(1),
      objectID: createBrandedValue(1),
      versionID: 1,
      objectType: 'organization' as FlowObjectType,
      refDirection: 'source' as EntityDirection,
    },
    {
      flowID: createBrandedValue(1),
      objectID: createBrandedValue(2),
      versionID: 1,
      objectType: 'organization' as FlowObjectType,
      refDirection: 'destination' as EntityDirection,
    },
    {
      flowID: createBrandedValue(2),
      objectID: createBrandedValue(2),
      versionID: 1,
      objectType: 'organization' as FlowObjectType,
      refDirection: 'source' as EntityDirection,
    },
    {
      flowID: createBrandedValue(2),
      objectID: createBrandedValue(3),
      versionID: 1,
      objectType: 'organization' as FlowObjectType,
      refDirection: 'destination' as EntityDirection,
    },
  ];
  beforeAll(async () => {
    // Create externalReferences
    await context.models.externalReference.createMany(externalReferences);

    // Create organizations
    const createdOrganization =
      await context.models.organization.createMany(organizations);

    // Update flowObjects with organization IDs
    flowObjectsOrganizations[0].objectID = createdOrganization[0].id;
    flowObjectsOrganizations[1].objectID = createdOrganization[1].id;
    flowObjectsOrganizations[2].objectID = createdOrganization[1].id;
    flowObjectsOrganizations[3].objectID = createdOrganization[2].id;

    // Create flowObjects
    await context.models.flowObject.createMany(flowObjectsOrganizations);
  });

  afterAll(async () => {
    // Delete externalReference
    await context.conn.table('externalReference').del();
  });
  describe('Test getFlowIDsFromEntity', () => {
    const flowService = new FlowService(new FlowObjectService());

    it("Case 1.1: if entity is 'externalReference' and order 'asc'", async () => {
      const orderBy: FlowOrderByWithSubEntity = buildOrderBy(
        'externalReference.systemID',
        'asc'
      );

      const result = await flowService.getFlowIDsFromEntity(
        context.models,
        orderBy
      );

      expect(result).toBeTruthy();
      expect(result.length).toBe(3);
      // Since order is asc, the first element should be 'CERF'
      expect(result[0]).toEqual(externalReferences[0].flowID);
    });

    it("Case 1.2: if entity is 'externalReference' and order 'desc'", async () => {
      const orderBy: FlowOrderByWithSubEntity = buildOrderBy(
        'externalReference.systemID',
        'desc'
      );

      const result = await flowService.getFlowIDsFromEntity(
        context.models,
        orderBy
      );

      expect(result).toBeTruthy();
      expect(result.length).toBe(3);
      // Since order is desc, the first element should be 'OCT'
      expect(result[0]).toEqual(externalReferences[3].flowID);
    });

    it("Case 2.1: if entity is a flowObject 'objectType' and order 'asc'", async () => {
      const orderBy: FlowOrderByWithSubEntity = buildOrderBy(
        'organization.source.name',
        'asc'
      );

      const result = await flowService.getFlowIDsFromEntity(
        context.models,
        orderBy
      );

      expect(result).toBeTruthy();
      expect(result.length).toBe(4);

      // Since order is asc, the first element should be 'AAAA'
      expect(result[0]).toEqual(flowObjectsOrganizations[0].flowID);
    });

    it("Case 2.2: if entity is a flowObject 'objectType' and order 'desc'", async () => {
      const orderBy: FlowOrderByWithSubEntity = buildOrderBy(
        'organization.source.name',
        'desc'
      );

      const result = await flowService.getFlowIDsFromEntity(
        context.models,
        orderBy
      );

      expect(result).toBeTruthy();
      expect(result.length).toBe(4);

      // Since order is desc, the first element should be 'ZZZZ'
      expect(result[0]).toEqual(flowObjectsOrganizations[4].flowID);
    });
  });
});
