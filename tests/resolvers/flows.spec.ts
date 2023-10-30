import ContextProvider from '../testContext';

const fullQuery = `query {
  searchFlows(first: 10, sortOrder: "DESC", sortField: "id") {
    total

    items {
      id

      createdAt

      amountUSD

      categories {
        name

        group
      }

      organizations {
        refDirection
        name
      }

      locations {
        name
      }

      plans {
        name
      }

      usageYears {
        year
        direction
      }

      cursor
    }

    startCursor

    hasNextPage

    endCursor

    hasPreviousPage

    pageSize
  }
}`;

const simpliedQuery = `query {
  searchFlows(
    first: 10
    sortOrder: "DESC"
    sortField: "id"
  ) {
    total

    items {
      id

      createdAt

      amountUSD

      cursor
    }

    startCursor

    hasNextPage

    endCursor

    hasPreviousPage

    pageSize
  }
}`;

describe('Query should return Flow search', () => {
  it('All data should be returned', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: fullQuery,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();

    const data = response.data as any;
    expect(data.searchFlows).toBeDefined();

    const searchFlowsResponse = data.searchFlows;
    expect(searchFlowsResponse.pageSize).toBe(10);
    expect(searchFlowsResponse.hasPreviousPage).toBe(false);
    expect(searchFlowsResponse.hasNextPage).toBe(true);
    expect(searchFlowsResponse.endCursor).toBeDefined();
    expect(searchFlowsResponse.startCursor).toBeDefined();
    expect(searchFlowsResponse.total).toBeDefined();
    expect(searchFlowsResponse.items).toBeDefined();

    const flows = searchFlowsResponse.items;
    expect(flows.length).toBe(10);

    const flow = flows[0];
    expect(flow.id).toBeDefined();
    expect(flow.cursor).toBeDefined();
    expect(flow.createdAt).toBeDefined();
    expect(flow.amountUSD).toBeDefined();
    expect(flow.categories).toBeDefined();
    expect(flow.categories.length).toBeGreaterThan(0);
    expect(flow.organizations).toBeDefined();
    expect(flow.organizations.length).toBeGreaterThan(0);
    expect(flow.locations).toBeDefined();
    expect(flow.locations.length).toBeGreaterThan(0);
    expect(flow.plans).toBeDefined();
    expect(flow.plans.length).toBeGreaterThan(0);
    expect(flow.usageYears).toBeDefined();
    expect(flow.usageYears.length).toBeGreaterThan(0);
  });

  it('All data should be returned', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: simpliedQuery,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();

    const data = response.data as any;
    expect(data.searchFlows).toBeDefined();

    const searchFlowsResponse = data.searchFlows;
    expect(searchFlowsResponse.pageSize).toBe(10);
    expect(searchFlowsResponse.hasPreviousPage).toBe(false);
    expect(searchFlowsResponse.hasNextPage).toBe(true);
    expect(searchFlowsResponse.endCursor).toBeDefined();
    expect(searchFlowsResponse.startCursor).toBeDefined();
    expect(searchFlowsResponse.total).toBeDefined();
    expect(searchFlowsResponse.items).toBeDefined();

    const flows = searchFlowsResponse.items;
    expect(flows.length).toBe(10);

    const flow = flows[0];
    expect(flow.id).toBeDefined();
    expect(flow.cursor).toBeDefined();
    expect(flow.createdAt).toBeDefined();
    expect(flow.amountUSD).toBeDefined();

    expect(flow.categories).toBeUndefined();
    expect(flow.organizations).toBeUndefined();
    expect(flow.locations).toBeUndefined();
    expect(flow.plans).toBeUndefined();
    expect(flow.usageYears).toBeUndefined();
  });

  it('Should return error when invalid sort field', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: `query {
          searchFlows(
            first: 10
            sortOrder: "DESC"
            sortField: "invalid"
          ) {
            total

            items {
              id

              createdAt

              amountUSD

              cursor
            }
          }
        }`,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeDefined();
    expect(response.data).toBeNull();
  });

  it('Should return error when invalid afterCursor', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: `query {
          searchFlows(
            first: 10
            sortOrder: "DESC"
            sortField: "id"
            afterCursor: "invalid"
          ) {
            total

            items {
              id

              createdAt

              amountUSD

              cursor
            }
          }
        }`,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeDefined();
    expect(response.data).toBeUndefined();
  });

  it('Should return error when invalid beforeCursor', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: `query {
          searchFlows(
            first: 10
            sortOrder: "DESC"
            sortField: "id"
            bedoreCursor: "invalid"
          ) {
            total

            items {
              id

              createdAt

              amountUSD

              cursor
            }
          }
        }`,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeDefined();
    expect(response.data).toBeUndefined();
  });

  it('Should return error when both afterCursor and beforeCursor are provided', async () => {
    const response =
      await ContextProvider.Instance.apolloTestServer.executeOperation({
        query: `query {
          searchFlows(
            first: 10
            sortOrder: "DESC"
            sortField: "id"
            afterCursor: "20"
            beforeCursor: "40"
          ) {
            total

            items {
              id

              createdAt

              amountUSD

              cursor
            }
          }
        }`,
      });

    expect(response).toBeDefined();
    expect(response.errors).toBeDefined();
    expect(response.data).toBeUndefined();
  });
});
