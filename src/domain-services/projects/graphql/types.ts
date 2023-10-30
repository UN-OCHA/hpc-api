import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class FileReference {
  @Field()
  fileHash: string;
}
@ObjectType()
export class PdfEntry {
  @Field()
  generatedAt: string;

  @Field(() => FileReference)
  file?: FileReference;
}
@ObjectType()
export class Pdf {
  @Field(() => PdfEntry, { nullable: true })
  anonymous?: PdfEntry;

  @Field(() => PdfEntry, { nullable: true })
  withComments?: PdfEntry;

  @Field(() => PdfEntry, { nullable: true })
  commentsOnly?: PdfEntry;
}

@ObjectType()
export default class Project {
  @Field()
  id: number;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;

  @Field()
  code: string;

  @Field()
  currentPublishedVersionId: number;

  @Field()
  creatorParticipantId: number;

  @Field()
  latestVersionId: number;

  @Field(() => String, { nullable: true })
  implementationStatus: ImplementationStatus;

  @Field(() => Pdf, { nullable: true })
  pdf: Pdf | null;

  @Field({ nullable: true })
  sourceProjectId: number;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  version: number;

  @Field({ nullable: true })
  projectVersionCode: string;

  @Field({ nullable: true })
  visible: boolean;
}

export type ImplementationStatus =
  | 'Planning'
  | 'Implementing'
  | 'Ended - Completed'
  | 'Ended - Terminated'
  | 'Ended - Not started and abandoned'
  | null;

export function mapPdfModelToType(pdfProject: PdfProps | null): Pdf | null {
  let pdfResponse: Pdf | null = {};

  if (pdfProject) {
    type PdfPropsType = 'anonymous' | 'withComments' | 'commentsOnly';
    const pdfProps: PdfPropsType[] = [
      'anonymous',
      'withComments',
      'commentsOnly',
    ];

    for (const prop of pdfProps) {
      const pdfProp = pdfProject && pdfProject[prop];

      if (pdfProp) {
        pdfResponse[prop] = {
          generatedAt: pdfProp.generatedAt.toString(),
          file: pdfProp.file,
        };
      }
    }
  } else {
    pdfResponse = null;
  }

  return pdfResponse;
}

export type PdfProps = {
  anonymous?:
    | {
        generatedAt: string | number;
        file: {
          fileHash: string;
        };
      }
    | undefined;
  withComments?:
    | {
        generatedAt: string | number;
        file: {
          fileHash: string;
        };
      }
    | undefined;
  commentsOnly?:
    | {
        generatedAt: string | number;
        file: {
          fileHash: string;
        };
      }
    | undefined;
} | null;
