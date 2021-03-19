import ReportingWindowAssignment from '../database/models/ReportingWindowAssignment'

export type FileStorageNamespace =
  | {
      type: 'reportingWindowAssignment';
      id: ReportingWindowAssignment['id'];
    }


/*
    TODO: Add more types into the union as the corresponding models get implemented

export type FileStorageNamespace =
  | {
      type: 'task';
      id: TaskId;
    }
  | {
      type: 'form';
      id: FormId;
    }
  | {
      type: 'reportingWindowAssignment';
      id: ReportingWindowAssignmentId;
    }
  | {
      type: 'projectPDFs';
      id: ProjectId;
    };

*/