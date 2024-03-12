import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import type Knex from 'knex';
import { Service } from 'typedi';
import { type UniqueFlowEntity } from '../flows/model';

@Service()
export class FlowObjectService {
  async getFlowIdsFromFlowObjects(
    models: Database,
    where: any
  ): Promise<FlowId[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    // Keep only not duplicated flowIDs
    return [...new Set(flowObjects.map((flowObject) => flowObject.flowID))];
  }

  async getFlowFromFlowObjects(
    models: Database,
    where: any
  ): Promise<UniqueFlowEntity[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    // Keep only not duplicated flowIDs
    return [
      ...new Set(
        flowObjects.map((flowObject) => {
          return {
            id: createBrandedValue(flowObject.flowID),
            versionID: flowObject.versionID,
          };
        })
      ),
    ];
  }

  async getFlowObjectByFlowId(models: Database, flowIds: FlowId[]) {
    return await models.flowObject.find({
      where: {
        flowID: {
          [Op.IN]: flowIds,
        },
      },
    });
  }

  async getFlowObjectsByFlowObjectConditions(
    databaseConnection: Knex,
    flowObjectConditions: any
  ) {
    // 1. Map flowObjectConditions to selectQuery
    let selectQuery = databaseConnection?.queryBuilder();

    // 1.1. Store FlowObjectConditions in two separate lists
    // One will store those filters with inclusive = false | undefined
    // The other will store those filters with inclusive = true
    const inclusiveFlowObjectConditions = flowObjectConditions.filter(
      (flowObjectCondition: any) => flowObjectCondition.inclusive
    );

    const exclusiveFlowObjectConditions = flowObjectConditions.filter(
      (flowObjectCondition: any) => !flowObjectCondition.inclusive
    );

    // 2 If there are elements in inclusiveFlowObjectConditions, map them to selectQuery
    // Each entry must be part of a 'where' 'orWhere' chain
    if (inclusiveFlowObjectConditions.length > 0) {
      selectQuery = selectQuery
        ?.select('flowID', 'versionID')
        .from('flowObject')
        .where(function () {
          this.where('objectID', '=', inclusiveFlowObjectConditions[0].objectID)
            .andWhere(
              'objectType',
              '=',
              inclusiveFlowObjectConditions[0].objectType
            )
            .andWhere(
              'refDirection',
              '=',
              inclusiveFlowObjectConditions[0].direction
            );
        });

      for (let i = 1; i < inclusiveFlowObjectConditions.length; i++) {
        selectQuery = selectQuery.orWhere(function () {
          this.where('objectID', '=', inclusiveFlowObjectConditions[i].objectID)
            .andWhere(
              'objectType',
              '=',
              inclusiveFlowObjectConditions[i].objectType
            )
            .andWhere(
              'refDirection',
              '=',
              inclusiveFlowObjectConditions[i].direction
            );
        });
      }
    }

    // 3 If there are elements in exclusiveFlowObjectConditions, map them to selectQuery
    // Each entry must be part of a 'where' intersect 'where' chain
    if (exclusiveFlowObjectConditions.length > 0) {
      selectQuery = selectQuery?.intersect(function () {
        this.select('flowID', 'versionID')
          .from('flowObject')
          .where(function () {
            this.where(
              'objectID',
              '=',
              exclusiveFlowObjectConditions[0].objectID
            )
              .andWhere(
                'objectType',
                '=',
                exclusiveFlowObjectConditions[0].objectType
              )
              .andWhere(
                'refDirection',
                '=',
                exclusiveFlowObjectConditions[0].direction
              );
          });

        for (let i = 1; i < exclusiveFlowObjectConditions.length; i++) {
          selectQuery = selectQuery?.intersect(function () {
            this.select('flowID', 'versionID')
              .from('flowObject')
              .where(function () {
                this.where(
                  'objectID',
                  '=',
                  exclusiveFlowObjectConditions[i].objectID
                )
                  .andWhere(
                    'objectType',
                    '=',
                    exclusiveFlowObjectConditions[i].objectType
                  )
                  .andWhere(
                    'refDirection',
                    '=',
                    exclusiveFlowObjectConditions[i].direction
                  );
              });
          });
        }
      });
    }

    // 4. Execute selectQuery
    return await selectQuery;
  }
}
