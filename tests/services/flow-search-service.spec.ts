import { SearchFlowsFilters } from '../../src/domain-services/flows/graphql/args';
import { prepareFlowConditions } from '../../src/domain-services/flows/strategy/impl/utils';

describe('FlowSearchService', () => {
  describe('PrepareFlowConditions', () => {
    test('should prepare flow conditions with all filters set to undefined', () => {
      const flowFilters = new SearchFlowsFilters();

      const result = prepareFlowConditions(flowFilters);

      expect(result).toEqual({});
    });

    test('should prepare flow conditions with some filters having falsy values', () => {
      const flowFilters = new SearchFlowsFilters();
      flowFilters.id = [];
      flowFilters.activeStatus = false;
      flowFilters.amountUSD = 0;

      const result = prepareFlowConditions(flowFilters);

      expect(result).toEqual({
        id: [],
        activeStatus: false,
        amountUSD: 0,
      });
    });
  });
});
