import Container from 'typedi';
import { FlowSearchService } from '../../src/domain-services/flows/flow-search-service';
import { SearchFlowsFilters } from '../../src/domain-services/flows/graphql/args';

describe('PrepareFlowConditions', () => {
  let flowSearchService: FlowSearchService;

  beforeEach(() => {
    // Initialize your class instance if needed
    flowSearchService = Container.get(FlowSearchService);
  });

  it('should prepare flow conditions with valid filters', () => {
    const flowFilters = new SearchFlowsFilters();
    flowFilters.id = 1;
    flowFilters.activeStatus = true;
    flowFilters.status = 'commitment';
    flowFilters.type = 'carryover';
    flowFilters.amountUSD = 1000;
    flowFilters.reporterReferenceCode = 123;
    flowFilters.sourceSystemId = 456;
    flowFilters.legacyId = 789;

    const result = flowSearchService.prepareFlowConditions(flowFilters);

    expect(result).toEqual({
      id: 1,
      activeStatus: true,
      status: 'commitment',
      type: 'carryover',
      amountUSD: 1000,
      reporterReferenceCode: 123,
      sourceSystemId: 456,
      legacyId: 789,
    });
  });

  it('should prepare flow conditions with some filters set to undefined', () => {
    const flowFilters = new SearchFlowsFilters();
    flowFilters.id = 1;
    flowFilters.activeStatus = true;

    const result = flowSearchService.prepareFlowConditions(flowFilters);

    expect(result).toEqual({
      id: 1,
      activeStatus: true,
    });
  });

  it('should prepare flow conditions with all filters set to undefined', () => {
    const flowFilters = new SearchFlowsFilters();

    const result = flowSearchService.prepareFlowConditions(flowFilters);

    expect(result).toEqual({});
  });

  it('should prepare flow conditions with some filters having falsy values', () => {
    const flowFilters = new SearchFlowsFilters();
    flowFilters.id = 0;
    flowFilters.activeStatus = false;
    flowFilters.amountUSD = 0;

    const result = flowSearchService.prepareFlowConditions(flowFilters);

    expect(result).toEqual({
      id: 0,
      activeStatus: false,
      amountUSD: 0,
    });
  });
});
