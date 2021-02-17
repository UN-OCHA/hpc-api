import { Field, InputType, ObjectType } from "type-graphql";

@InputType({ description: 'Data representing the file content' })
class FileData {
    @Field({ description: 'hash of the file' })
    fileHash: string
}

@InputType({ description: 'Object representing a file' })
export class FileObject {
  @Field({ description: 'Name of the file' })
  name: string;

  @Field({ description: 'The data representing the file content' })
  data: FileData;
}