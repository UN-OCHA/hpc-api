import { type Op } from '@unocha/hpc-api-core/src/db/util/conditions';

export type CategoryGroup =
  | 'beneficiaryGroup'
  | 'contributionStatus'
  | 'contributionType'
  | 'customLocation'
  | 'earmarkingType'
  | 'emergencyType'
  | 'flowStatus'
  | 'flowType'
  | 'genderMarker'
  | 'inactiveReason'
  | 'keywords'
  | 'method'
  | 'organizationLevel'
  | 'organizationType'
  | 'pendingStatus'
  | 'planCosting'
  | 'planIndicated'
  | 'planType'
  | 'projectGrouping1'
  | 'projectGrouping2'
  | 'projectPriority'
  | 'regions'
  | 'reportChannel'
  | 'responseType'
  | 'sectorIASC'
  | 'subsetOfPlan';

export type ShortcutCategoryFilter = {
  category: string;
  operation: typeof Op.IN | typeof Op.NOT_IN;
  id: number;
};
