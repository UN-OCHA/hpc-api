import ContextProvider from '../testContext';


describe('Query should return Flow search', () => {
    
    it('All data should be returned', async () => {
        const response = await ContextProvider.Instance.apolloTestServer.executeOperation({
          query: 'query { searchFlows (first:10) { totalCount edges { node { id createdAt amountUSD category } cursor } pageInfo { startCursor hasNextPage endCursor hasPreviousPage pageSize } } }',

        });
      
        expect(response).toBeDefined();
        expect(response.errors).toBeUndefined();
        expect(response.data).toBeDefined();
        const data = response.data as any;
        expect(data.flows).toBeDefined();
        expect(data.flows.length).toBeGreaterThan(0);
        const flows = data.flows[0];
        expect(flows.id).toBeDefined();
      });
});

