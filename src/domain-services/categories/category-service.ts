import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import {
  Cond,
  Op,
  type Condition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { Service } from 'typedi';
import { type ReportDetail } from '../report-details/graphql/types';
import { type Category } from './graphql/types';
import { type ShortcutCategoryFilter } from './model';

// Local types definition to increase readability
type CategoryRefModel = Database['categoryRef'];
type CategoryRefInstance = InstanceOfModel<CategoryRefModel>;
type CategoryRefWhere = Condition<CategoryRefInstance>;

type CategoryModel = Database['category'];
type CategoryInstance = InstanceOfModel<CategoryModel>;
type CategoryWhere = Condition<CategoryInstance>;

@Service()
export class CategoryService {
  async getCategoriesForFlows(
    flowWithVersion: Map<FlowId, number[]>,
    models: Database
  ): Promise<Map<number, Map<number, Category[]>>> {
    // Group of flowIDs and its versions
    // Structure:
    // flowID: {
    //   versionID: [categories]
    // }
    const flowVersionCategoryMap = new Map<number, Map<number, Category[]>>();

    const flowIDs: FlowId[] = [];
    for (const flowID of flowWithVersion.keys()) {
      flowIDs.push(flowID);
    }

    const categoriesRef: CategoryRefInstance[] = await models.categoryRef.find({
      where: {
        objectID: {
          [Op.IN]: flowIDs,
        },
        objectType: 'flow',
      },
    });

    const categories: CategoryInstance[] = await models.category.find({
      where: {
        id: {
          [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
        },
      },
    });

    // Populate the map with categories for each flow
    for (const catRef of categoriesRef) {
      const flowId = catRef.objectID.valueOf();

      if (!flowVersionCategoryMap.has(flowId)) {
        flowVersionCategoryMap.set(flowId, new Map());
      }

      // Here the key is the versionID of the flow
      const flowVersionMap = getOrCreate(
        flowVersionCategoryMap,
        flowId,
        () => new Map<number, Category[]>()
      );

      const flowVersion = catRef.versionID;
      if (!flowVersionMap.has(flowVersion)) {
        flowVersionMap.set(flowVersion, []);
      }

      const categoriesPerFlowVersion = getOrCreate(
        flowVersionMap,
        flowVersion,
        () => []
      );

      const category = categories.find((cat) => cat.id === catRef.categoryID);

      if (
        category &&
        !categoriesPerFlowVersion.some(
          (cat) => cat.id === category.id.valueOf()
        )
      ) {
        const mappedCategory = this.mapCategoryToFlowCategory(category, catRef);
        categoriesPerFlowVersion.push(mappedCategory);
      }
    }

    return flowVersionCategoryMap;
  }

  private mapCategoryToFlowCategory(
    category: CategoryInstance,
    categoryRef: CategoryRefInstance
  ): Category {
    return {
      id: category.id,
      name: category.name,
      group: category.group,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      description: category.description ?? '',
      parentID: category.parentID ? category.parentID.valueOf() : null,
      code: category.code ?? '',
      includeTotals: category.includeTotals ?? false,
      categoryRef: {
        objectID: categoryRef.objectID.valueOf(),
        versionID: categoryRef.versionID,
        objectType: categoryRef.objectType,
        categoryID: category.id.valueOf(),
        createdAt: categoryRef.createdAt.toISOString(),
        updatedAt: categoryRef.updatedAt.toISOString(),
      },
      versionID: categoryRef.versionID,
    };
  }

  async findCategories(models: Database, where: CategoryWhere) {
    const categories = await models.category.find({
      where,
    });

    return categories;
  }

  async findCategoryRefs(models: Database, where: CategoryRefWhere) {
    const categoryRef = await models.categoryRef.find({
      where,
    });

    return categoryRef;
  }

  async addChannelToReportDetails(
    models: Database,
    reportDetails: ReportDetail[]
  ): Promise<ReportDetail[]> {
    const listOfCategoryRefORs: Array<Condition<CategoryRefInstance>> = [];

    for (const reportDetail of reportDetails) {
      const orClause = {
        objectID: reportDetail.id,
        objectType: 'reportDetail',
      } satisfies Condition<CategoryRefInstance>;

      listOfCategoryRefORs.push(orClause);
    }

    const categoriesRef: CategoryRefInstance[] = await models.categoryRef.find({
      where: {
        [Cond.OR]: listOfCategoryRefORs,
      },
    });

    const mapOfCategoriesAndReportDetails = new Map<number, ReportDetail[]>();

    for (const categoryRef of categoriesRef) {
      const reportDetail = reportDetails.find(
        (reportDetail) => reportDetail.id === categoryRef.objectID.valueOf()
      );

      if (!reportDetail) {
        continue;
      }

      if (
        !mapOfCategoriesAndReportDetails.has(categoryRef.categoryID.valueOf())
      ) {
        mapOfCategoriesAndReportDetails.set(
          categoryRef.categoryID.valueOf(),
          []
        );
      }

      const reportDetailsPerCategory = getOrCreate(
        mapOfCategoriesAndReportDetails,
        categoryRef.categoryID.valueOf(),
        () => []
      );
      reportDetailsPerCategory.push(reportDetail);
    }

    const categories: CategoryInstance[] = await models.category.find({
      where: {
        id: {
          [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
        },
      },
    });

    for (const [
      category,
      reportDetails,
    ] of mapOfCategoriesAndReportDetails.entries()) {
      const categoryObj = categories.find((cat) => cat.id === category);

      if (!categoryObj) {
        continue;
      }

      for (const reportDetail of reportDetails) {
        reportDetail.channel = categoryObj.name;
      }
    }

    return reportDetails;
  }

  /**
   * This method returns the shortcut filter defined with the operation
   * IN if is true or NOT IN if is false
   *
   * @param isPendingFlows
   * @param isCommitmentFlows
   * @param isPaidFlows
   * @param isPledgedFlows
   * @param isCarryoverFlows
   * @param isParkedFlows
   * @param isPassThroughFlows
   * @param isStandardFlows
   * @returns [{ category: String, operation: Op.IN | Op.NOT_IN}]
   */
  async mapShortcutFilters(
    database: Database,
    isPendingFlows: boolean,
    isCommitmentFlows: boolean,
    isPaidFlows: boolean,
    isPledgedFlows: boolean,
    isCarryoverFlows: boolean,
    isParkedFlows: boolean,
    isPassThroughFlows: boolean,
    isStandardFlows: boolean
  ): Promise<ShortcutCategoryFilter[] | null> {
    const filters = [
      { flag: isPendingFlows, category: 'Pending' },
      { flag: isCommitmentFlows, category: 'Commitment' },
      { flag: isPaidFlows, category: 'Paid' },
      { flag: isPledgedFlows, category: 'Pledge' },
      { flag: isCarryoverFlows, category: 'Carryover' },
      { flag: isParkedFlows, category: 'Parked' },
      { flag: isPassThroughFlows, category: 'Pass Through' },
      { flag: isStandardFlows, category: 'Standard' },
    ];

    const searchCategories = filters
      .filter((filter) => filter.flag !== undefined)
      .map((filter) => filter.category);

    const whereClause: CategoryWhere = {
      name: {
        [Op.IN]: searchCategories,
      },
    };

    const categories = await this.findCategories(database, whereClause);

    const shortcutFilters: ShortcutCategoryFilter[] = filters
      .filter((filter) => filter.flag !== undefined)
      .map((filter) => {
        const categoryId = categories
          .find((category) => category.name === filter.category)
          ?.id.valueOf();
        return {
          category: filter.category,
          operation: filter.flag ? Op.IN : Op.NOT_IN,
          id: categoryId,
        } satisfies ShortcutCategoryFilter;
      })
      .filter((filter) => filter.id !== undefined);

    return shortcutFilters.length > 0 ? shortcutFilters : null;
  }
}
