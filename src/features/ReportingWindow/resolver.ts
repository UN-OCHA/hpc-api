import { Arg, Authorized, Ctx, Mutation, Query } from 'type-graphql';
import { GraphQLUpload, FileUpload as IFileUpload } from 'graphql-upload';

import { AuthRequirementsGenerator, RequiredPermissionsCondition, RequiredPermissionsConditionOr } from '../../types/AuthRequirements';
import { GLOBAL_PERMISSIONS, OPERATION_CLUSTER_PERMISSIONS, OPERATION_PERMISSIONS } from '../../types/Permissions';
import ReportingWindowAssignment, { AssigneeType } from '../../models/ReportingWindowAssignment';
import Participant from '../../models/Participant';
import Context from '../../types/Context';
import * as errors from '../../errors'
import { UpdateAssignmentInput } from './input';
import { FileStorageNamespace } from '../../types/FileStorageNamespace';
import FileRecord from '../../models/FileRecord';
import FileService from '../../services/FileService';

export default class ReportingWindowAssignmentResolver {

    static canViewAssignmentData: AuthRequirementsGenerator = async ({
        log,
        req,
        args
    }) => {
        const { assignmentId } = args as { assignmentId: string };
        console.log("assignmentId: ", assignmentId);
        const assignment = await ReportingWindowAssignment.findOne(assignmentId);
        if (!assignment) {
            throw new Error("not found Error");
        }
        const { assignee } = assignment.versionModelInstance.data;
        if (assignee.type === AssigneeType.operation) {
            return [{
                data: {
                    assignment
                },
                condition: {
                    or: [
                        {
                            type: 'global',
                            permission: GLOBAL_PERMISSIONS.VIEW_OPERATION_DATA
                        },
                        {
                            type: 'operation',
                            permission: OPERATION_PERMISSIONS.VIEW_DATA,
                            id: assignee.operation
                        },
                        {
                            type: 'operation',
                            permission: OPERATION_PERMISSIONS.VIEW_ASSIGNMENT_DATA,
                            id: assignee.operation
                        }
                    ]
                }
            }]
        } else if (assignee.type === AssigneeType.operationCluster) {
            // To be done after operation cluster is implemented
        }
        throw new Error(`Unknown assignee: ${JSON.stringify(assignee)}`);
    }

    static canEditAssignment: AuthRequirementsGenerator = async({
        log,
        req,
        args
    }) => {
        console.log("in can edit")
        const canView = await ReportingWindowAssignmentResolver.canViewAssignmentData({log, req, args});
        const { assignment } = canView[0].data as { assignment: ReportingWindowAssignment }
        const canEditCondition: RequiredPermissionsConditionOr = {
            or: []
        };
        
        const { assignee, task } = assignment.versionModelInstance.data;

        if (task.type === 'form') {
            /**
             * Only someone with clean edit permissions can modify data that is clean
             * or finalized.
             */
            const requireCleanEditor =
              task.state && (task.state.type === 'clean' || task.state.finalized)
        
            canEditCondition.or.push({
              type: 'global',
              permission: requireCleanEditor ?
                GLOBAL_PERMISSIONS.EDIT_FORM_ASSIGNMENT_CLEAN_DATA :
                GLOBAL_PERMISSIONS.EDIT_FORM_ASSIGNMENT_RAW_DATA
            });
        
            if (assignee.type === 'operation') {
              canEditCondition.or.push({
                type: 'operation',
                id: assignee.operation,
                permission: requireCleanEditor ?
                  OPERATION_PERMISSIONS.EDIT_ASSIGNMENT_CLEAN_DATA :
                  OPERATION_PERMISSIONS.EDIT_ASSIGNMENT_RAW_DATA
              });
            } else if(assignee.type === 'operationCluster') {
              const cluster = canView[0].data.cluster;
              if (!cluster) {
                // This should never occur
                throw new Error('missing cluster');
              }
              canEditCondition.or.push({
                type: 'operation',
                id: cluster.data.operation,
                permission: requireCleanEditor ?
                  OPERATION_PERMISSIONS.EDIT_ASSIGNMENT_CLEAN_DATA :
                  OPERATION_PERMISSIONS.EDIT_ASSIGNMENT_RAW_DATA
              });
              canEditCondition.or.push({
                type: 'operationCluster',
                id: cluster.id,
                permission: requireCleanEditor ?
                  OPERATION_CLUSTER_PERMISSIONS.EDIT_ASSIGNMENT_CLEAN_DATA :
                  OPERATION_CLUSTER_PERMISSIONS.EDIT_ASSIGNMENT_RAW_DATA
              });
            } else {
              const _n: never = assignee;
              throw new Error(`Unknown assignee: ${JSON.stringify(assignee)}`);
            }
          } else {
            const _n: never = task.type;
            throw new Error(`Unknown task type`);
          }
          const condition: RequiredPermissionsCondition = {
            and: [
              // Require both edit and view conditions
              canView[0].condition,
              canEditCondition
            ]
          }
        
          return [{
            data: canView[0].data,
            condition,
          }]
    }

    @Authorized([ReportingWindowAssignmentResolver.canViewAssignmentData])
    @Query(_returns => ReportingWindowAssignment, {
        description: 'Get A particular reporting window assignment'
    })
    getAssignment(
        @Arg('assignmentId', {description: 'ID of the assignment to get'}) assignmentId: number,
        @Ctx() ctx: Context
    ) {
        return ReportingWindowAssignment.findOne({
            id: assignmentId
        }, {
            relations: ['reportingWindow']
        })
    }

    @Authorized([ReportingWindowAssignmentResolver.canEditAssignment])
    @Mutation(_returns => ReportingWindowAssignment, {
        description: "Get all the reporting window assignments",
    })
    async updateAssignment(
        @Arg('assignmentId', {description: 'ID of the assignment to get'}) assignmentId: number,
        @Arg('body', { description: "The body of the request" }) body: UpdateAssignmentInput,
        @Ctx() ctx: Context,
    ) {
        if(!ctx.participant) {
            throw new Error('Unable to find user');
        }

        const originalAssignment = await ReportingWindowAssignment.findOne(assignmentId);
        if (!originalAssignment) {
            throw new Error("Unable to find assignment");
        }

        if (originalAssignment.versionModelInstance.version !== body.previousVersion) {
            const error = {
              message: 'Error while updating assignment',
            };
            const { updatedAt, modifiedBy } = originalAssignment.versionModelInstance;
            const participant = await Participant.findOne(modifiedBy);
            const otherUser = `${participant?.name_given} ${participant?.name_family}`;
            throw new errors.ConflictError(error, 'ReportingWindow', updatedAt, otherUser);
        }

        if (originalAssignment.versionModelInstance.data.task.state?.finalized) {
            throw new errors.BadRequestError('Assignment has been finalised', 'ReportingWindow');
        }

        const a = originalAssignment;
        let state = a.versionModelInstance.data.task.state;
        if (state) {
            state = {
                ...state,
                finalized: body.form.finalized, 
                data: body.form.data, 
                files: body.form.files
            }
        } else {
            state = {
                type: 'raw',
                finalized: body.form.finalized, 
                data: body.form.data,
                files: body.form.files
            }
        }

        a.versionModelInstance.data.task.state = state;

        // Check all files have been uploaded
        const storageNamespace: FileStorageNamespace = {
            type: 'reportingWindowAssignment',
            id: a.id,
        }
  
        const currentFileHashes =
            new Set((await FileRecord.listFilesInNamespace(storageNamespace)).map(f => f.hash));
        const missingFileHashes =
            state.files?.filter(fh => !currentFileHashes.has(fh.data.fileHash))
  
        if (missingFileHashes?.length) {
            const missingNames = missingFileHashes.map(f => f.name).join(',');
            throw new errors.BadRequestError(
                `The following files have not been uploaded: ${missingNames}`,
                'updateAssignment'
            );
        }
        const r = await originalAssignment.Update(a.versionModelInstance.version, a.versionModelInstance.data, ctx.participant.id);
        return r;
    }

    @Authorized([ReportingWindowAssignmentResolver.canEditAssignment])
    @Mutation(_returns => FileRecord, {
        description: "Get all the reporting window assignments",
    })
    async uploadAssignmentFile (
        @Arg('assignmentId', {description: 'ID of the assignment to get'}) assignmentId: number,
        @Arg('file', () => GraphQLUpload) file: IFileUpload,
        @Arg('fileHash', { description: "hash of the file" }) fileHash: string,
    ) {
        const assignment = await ReportingWindowAssignment.findOne(assignmentId);

        if (!assignment) {
            throw new errors.NotFoundError(
              `Unable to find assignment with the ID ${assignmentId}`,
              'uploadAssignmentFile'
            );
        }

        const fileService = new FileService();
        const storageNamespace: FileStorageNamespace = {
            type: 'reportingWindowAssignment',
            id: assignment.id,
        };

        const fileRecord = await fileService.upload(file, fileHash, storageNamespace);
        await fileRecord.save();

        return fileRecord;
    }
}