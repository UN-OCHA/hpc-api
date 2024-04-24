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
    test('should prepare flow conditions with all filters set to undefined', () => {
      const flowFilters = new SearchFlowsFilters();

      const result = flowSearchService.prepareFlowConditions(flowFilters);

      expect(result).toEqual({});
    });

    test('should prepare flow conditions with some filters having falsy values', () => {
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
    test('should prepare flow object conditions correctly', () => {
      const flowObjectFilters: FlowObjectFilters[] = [
        {
          objectType: 'organization',
          direction: 'source',
          objectID: 12_469,
          inclusive: false,
        },
        {
          objectType: 'organization',
          direction: 'destination',
          objectID: 5197,
          inclusive: false,
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

    test('should throw an error for duplicate flow object filter', () => {
      const flowObjectFilters: FlowObjectFilters[] = [
        {
          objectType: 'organization',
          direction: 'source',
          objectID: 12_469,
          inclusive: false,
        },
        {
          objectType: 'organization',
          direction: 'source',
          objectID: 12_469,
          inclusive: false,
        }, // Duplicate filter
      ];

      expect(() =>
        flowSearchService.prepareFlowObjectConditions(flowObjectFilters)
      ).toThrowError('Duplicate flow object filter: organization source 12469');
    });
  });
});
