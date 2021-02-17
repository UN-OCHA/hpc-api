import { Field, InputType } from "type-graphql";

import { BaseForm } from "../common/baseForm";
import { FileObject } from "../common/FileObject";

@InputType({ description: 'FormInput for update Assignment' })
class UpdateAssignmentInputForm extends BaseForm {
    @Field({ description: 'data to be entered' })
    data: string;

    @Field({ description: 'is it finalized?' })
    finalized: boolean;

    @Field(() => [FileObject], { description: "List of file objects to be used as input in the form" })
    files: FileObject[]
}

@InputType({ description: 'The input fields for a package address' })
export class UpdateAssignmentInput {
  @Field({ description: 'The Previous Version of the assignment' })
  previousVersion: number;

  @Field(() => UpdateAssignmentInputForm, { description: 'Form Input' })
  form: UpdateAssignmentInputForm;
}