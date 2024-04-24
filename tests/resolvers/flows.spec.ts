import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { type GraphQLResponse } from 'apollo-server-types';
import type {
  Flow,
  FlowSearchResult,
} from '../../src/domain-services/flows/graphql/types';
import ContextProvider from '../testContext';
const defaultPageSize = 10;

const defaultSortField = '"flow.updatedAt"';
const defaultSortOrder = '"DESC"';

type SearchFlowGQLResponse = {
  searchFlows: FlowSearchResult;
};

function buildSimpleQuery(
  limit: number | null,
  sortField: string,
  sortOrder: string,
  pending: boolean = false
) {
  const query = `query {
    searchFlows(
      limit: ${limit}
      sortField: ${sortField}
      sortOrder: ${sortOrder}
      pending: ${pending}
      flowFilters: { activeStatus: ${!pending} }
    ) {
      total
      flows {
        id
        versionID
        updatedAt
        amountUSD
        activeStatus
      }
  
      prevPageCursor
  
      hasNextPage
  
      nextPageCursor
  
      hasPreviousPage
  
      pageSize
    }
  }
  `;

  return query;
}

function buildFullQuery(
  limit: number,
  sortField: string,
  sortOrder: string,
  pending: boolean = false
) {
  const fullQuery = `query {
    searchFlows(
      limit: ${limit}
      sortField: ${sortField}
      sortOrder: ${sortOrder}
      pending: ${pending}
      flowFilters: { activeStatus: ${!pending} }
    ) {
      total
      flows {
        id
        updatedAt
        amountUSD
        versionID
        activeStatus
        restricted
        exchangeRate
        flowDate
        newMoney
        decisionDate
        categories {
          id
          name
          group
          createdAt
          updatedAt
          description
          parentID
          code
          includeTotals
          categoryRef {
            objectID
            versionID
            objectType
            categoryID
            updatedAt
          }
        }
  
        organizations {
          id
          name
          direction
          abbreviation
        }
  
        destinationOrganizations {
          id
          name
          direction
          abbreviation
        }
  
        sourceOrganizations {
          id
          name
          direction
          abbreviation
        }
  
        plans {
          id
          name
          direction
        }
  
        usageYears {
          year
          direction
        }
        childIDs
        parentIDs
        origAmount
        origCurrency
        locations {
          id
          name
          direction
        }
        externalReferences {
          systemID
          flowID
          externalRecordID
          externalRecordDate
          versionID
          createdAt
          updatedAt
        }
        reportDetails {
          id
          flowID
          versionID
          contactInfo
          refCode
          organizationID
          channel
          source
          date
          verified
          updatedAt
          createdAt
          sourceID
        }
        parkedParentSource {
          orgName
          organization
        }
      }
  
      prevPageCursor
  
      hasNextPage
  
      nextPageCursor
  
      hasPreviousPage
  
      pageSize
    }
  }
  `;

  return fullQuery;
}

describe('Query should return Flow search', () => {
  beforeAll(async () => {
    const models = ContextProvider.Instance.models;

    const activeFlowsProt = [];
    const pendingFlowsProt = [];

    // Create 20 active and pending flows
    for (let i = 0; i < 20; i++) {
      const flow = {
        amountUSD: 10_000,
        updatedAt: new Date(),
        flowDate: new Date(),
        origCurrency: 'USD',
        origAmount: 10_000,
      };

      activeFlowsProt.push({
        ...flow,
        activeStatus: true,
      });

      pendingFlowsProt.push({
        ...flow,
        activeStatus: false,
      });
    }
    const activeFlows = await models.flow.createMany(activeFlowsProt);
    const pendingFlows = await models.flow.createMany(pendingFlowsProt);

    // Create category group
    const categoryGroup = {
      name: 'Flow Status',
      type: 'flowStatus' as const,
    };

    await models.categoryGroup.create(categoryGroup);

    // Create categories
    const categoriesProt = [
      {
        id: createBrandedValue(136),
        name: 'Not Pending',
        group: 'flowStatus' as const,
        code: 'not-pending',
      },
      {
        id: createBrandedValue(45),
        name: 'Pending',
        group: 'flowStatus' as const,
        code: 'pending',
      },
    ];

    await models.category.createMany(categoriesProt);

    // Asign categories to flows
    const activeFlowRelationCategory = activeFlows.map((flow) => {
      return {
        objectID: flow.id,
        objectType: 'flow' as 'plan',
        categoryID: createBrandedValue(136),
      };
    });

    const pendingFlowRelationCategory = pendingFlows.map((flow) => {
      return {
        objectID: flow.id,
        objectType: 'flow' as 'plan',
        categoryID: createBrandedValue(45),
      };
    });

    await models.categoryRef.createMany(activeFlowRelationCategory);
    await models.categoryRef.createMany(pendingFlowRelationCategory);
  });

  afterAll(async () => {
    const connection = ContextProvider.Instance.conn;
    await connection.table('flow').del();
    await connection.table('category').del();
    await connection.table('categoryRef').del();
    await connection.table('categoryGroup').del();
  });

  test('All data should be returned (full query) [pending = false]', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildFullQuery(
          defaultPageSize,
          defaultSortField,
          defaultSortOrder,
          false
        ),
      });

    validateSearchFlowResponse(response);

    const data = response.data as SearchFlowGQLResponse;

    validateSearchFlowResponseData(data);

    const searchFlowsResponse: FlowSearchResult = data.searchFlows;
    const flows = searchFlowsResponse.flows;

    validateFlowResponseFullQuery(flows);
  });

  test('All data should be returned (simpleQuery) [pending = false]', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildSimpleQuery(
          defaultPageSize,
          defaultSortField,
          defaultSortOrder,
          false
        ),
      });

    validateSearchFlowResponse(response);

    const data = response.data as SearchFlowGQLResponse;

    validateSearchFlowResponseData(data);

    const searchFlowsResponse: FlowSearchResult = data.searchFlows;
    const flows = searchFlowsResponse.flows;

    validateFlowResponseSimpleQuery(flows);
  });

  test('All data should be returned (full query) [pending = true]', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildFullQuery(
          defaultPageSize,
          defaultSortField,
          defaultSortOrder,
          true
        ),
      });

    validateSearchFlowResponse(response);

    const data = response.data as SearchFlowGQLResponse;

    validateSearchFlowResponseData(data);

    const searchFlowsResponse: FlowSearchResult = data.searchFlows;
    const flows = searchFlowsResponse.flows;
    validateFlowResponseFullQuery(flows);
  });

  test('All data should be returned (simpleQuery) [pending = true]', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildSimpleQuery(
          defaultPageSize,
          defaultSortField,
          defaultSortOrder,
          true
        ),
      });

    validateSearchFlowResponse(response);

    const data = response.data as SearchFlowGQLResponse;

    validateSearchFlowResponseData(data);

    const searchFlowsResponse: FlowSearchResult = data.searchFlows;
    const flows = searchFlowsResponse.flows;
    validateFlowResponseSimpleQuery(flows);
  });

  function validateSearchFlowResponse(response: GraphQLResponse) {
    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
  }

  function validateSearchFlowResponseData(data: SearchFlowGQLResponse) {
    expect(data.searchFlows).toBeDefined();

    const searchFlowsResponse: FlowSearchResult = data.searchFlows;
    expect(searchFlowsResponse.pageSize).toBe(defaultPageSize);
    expect(searchFlowsResponse.hasPreviousPage).toBeDefined();
    expect(searchFlowsResponse.hasNextPage).toBeDefined();
    expect(searchFlowsResponse.nextPageCursor).toBeDefined();
    expect(searchFlowsResponse.prevPageCursor).toBeDefined();
    expect(searchFlowsResponse.total).toBeDefined();
    expect(searchFlowsResponse.flows).toBeDefined();
  }

  function validateFlowResponseFullQuery(flows: Flow[]) {
    expect(flows.length).toBeLessThanOrEqual(defaultPageSize);
    expect(flows.length).toBeGreaterThan(0);

    // We can get at least the first
    const flow = flows[0];

    expect(flow.id).toBeDefined();
    expect(flow.updatedAt).toBeDefined();
    expect(flow.amountUSD).toBeDefined();
    expect(flow.categories).toBeDefined();
    expect(flow.categories.length).toBeGreaterThan(0);
    expect(flow.organizations).toBeDefined();
    expect(flow.locations).toBeDefined();
    expect(flow.plans).toBeDefined();
    expect(flow.usageYears).toBeDefined();
  }

  function validateFlowResponseSimpleQuery(flows: Flow[]) {
    expect(flows.length).toBeLessThanOrEqual(defaultPageSize);
    expect(flows.length).toBeGreaterThan(0);
    // We can get at least the first
    const flow = flows[0];

    expect(flow.id).toBeDefined();
    expect(flow.updatedAt).toBeDefined();
    expect(flow.amountUSD).toBeDefined();

    expect(flow.categories).toBeUndefined();
    expect(flow.organizations).toBeUndefined();
    expect(flow.locations).toBeUndefined();
    expect(flow.plans).toBeUndefined();
    expect(flow.usageYears).toBeUndefined();
  }
});

describe('GraphQL does not return data but error', () => {
  test('Should return error when invalid sort field', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildSimpleQuery(defaultPageSize, 'invalid', defaultSortOrder),
      });

    validateGraphQLResponseError(response);
  });

  test('Should return error when invalid sort order', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildSimpleQuery(defaultPageSize, defaultSortField, 'invalid'),
      });

    validateGraphQLResponseError(response);
  });

  test('Should return error when no limit is provided', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: buildSimpleQuery(null, defaultSortField, defaultSortOrder),
      });

    validateGraphQLResponseError(response);
  });

  function validateGraphQLResponseError(response: GraphQLResponse) {
    expect(response).toBeDefined();
    expect(response.errors).toBeDefined();
    expect(response.data).toBeUndefined();
  }
});
