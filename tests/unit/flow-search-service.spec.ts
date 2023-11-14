import Container from 'typedi';
import { FlowSearchService } from '../../src/domain-services/flows/flow-search-service';
import {
  SearchFlowsFilters,
  type FlowObjectFilters,
} from '../../src/domain-services/flows/graphql/args';

describe('FlowSearchService', () => {
  let flowSearchService: FlowSearchService;

  beforeEach(() => {
    // Initialize your class instance if needed
    flowSearchService = Container.get(FlowSearchService);
  });
  describe('PrepareFlowConditions', () => {
    it('should prepare flow conditions with valid filters', () => {
      const flowFilters = new SearchFlowsFilters();
      flowFilters.id = [1];
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
      flowFilters.id = [1];
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
      flowFilters.id = [];
      flowFilters.activeStatus = false;
      flowFilters.amountUSD = 0;

      const result = flowSearchService.prepareFlowConditions(flowFilters);

      expect(result).toEqual({
        id: [],
        activeStatus: false,
        amountUSD: 0,
      });
    });
  });
  describe('prepareFlowObjectConditions', () => {
    it('should prepare flow object conditions correctly', () => {
      const flowObjectFilters: FlowObjectFilters[] = [
        { objectType: 'organization', direction: 'source', objectID: 12_469 },
        {
          objectType: 'organization',
          direction: 'destination',
          objectID: 5197,
        },
      ];

      const result =
        flowSearchService.prepareFlowObjectConditions(flowObjectFilters);

      const expected = new Map<string, Map<string, number[]>>([
        [
          'organization',
          new Map<string, number[]>([
            ['source', [12_469]],
            ['destination', [5197]],
          ]),
        ],
      ]);

      expect(result).toEqual(expected);
    });

    it('should throw an error for duplicate flow object filter', () => {
      const flowObjectFilters: FlowObjectFilters[] = [
        { objectType: 'organization', direction: 'source', objectID: 12_469 },
        { objectType: 'organization', direction: 'source', objectID: 12_469 }, // Duplicate filter
      ];

      expect(() =>
        flowSearchService.prepareFlowObjectConditions(flowObjectFilters)
      ).toThrowError('Duplicate flow object filter: organization source 12469');
    });
  });
});
