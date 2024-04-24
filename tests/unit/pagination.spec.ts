import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { prepareConditionFromCursor } from '../../src/utils/graphql/pagination';

describe('Based on cursor and order for pagination', () => {
  describe('Order is asc', () => {
    const sortCondition = { column: 'id', order: 'asc' as const };

    test("Should return 'GT' when afterCursor is defined", () => {
      const afterCursor = 1;
      const beforeCursor = undefined;
      const result = prepareConditionFromCursor(
        sortCondition,
        afterCursor,
        beforeCursor
      );
      expect(result.id).toEqual({ [Op.GT]: afterCursor });
    });

    test("Should return 'LT' when beforeCursor is defined", () => {
      const afterCursor = undefined;
      const beforeCursor = 1;
      const result = prepareConditionFromCursor(
        sortCondition,
        afterCursor,
        beforeCursor
      );
      expect(result.id).toEqual({ [Op.LT]: beforeCursor });
    });

    test('Should throw an error when both afterCursor and beforeCursor are defined', () => {
      const afterCursor = 1;
      const beforeCursor = 2;
      expect(() =>
        prepareConditionFromCursor(sortCondition, afterCursor, beforeCursor)
      ).toThrowError('Cannot use before and after cursor at the same time');
    });
  });

  describe("Order is 'desc'", () => {
    const sortCondition = { column: 'id', order: 'desc' as const };

    test("Should return 'LT' when afterCursor is defined", () => {
      const afterCursor = 1;
      const beforeCursor = undefined;
      const result = prepareConditionFromCursor(
        sortCondition,
        afterCursor,
        beforeCursor
      );
      expect(result.id).toEqual({ [Op.LT]: afterCursor });
    });

    test("Should return 'GT' when beforeCursor is defined", () => {
      const afterCursor = undefined;
      const beforeCursor = 1;
      const result = prepareConditionFromCursor(
        sortCondition,
        afterCursor,
        beforeCursor
      );
      expect(result.id).toEqual({ [Op.GT]: beforeCursor });
    });

    test('Should throw an error when both afterCursor and beforeCursor are defined', () => {
      const afterCursor = 1;
      const beforeCursor = 2;
      expect(() =>
        prepareConditionFromCursor(sortCondition, afterCursor, beforeCursor)
      ).toThrowError('Cannot use before and after cursor at the same time');
    });
  });
});
