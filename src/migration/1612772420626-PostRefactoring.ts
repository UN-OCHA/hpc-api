import {MigrationInterface, QueryRunner} from "typeorm";

export class PostRefactoring1612772420626 implements MigrationInterface {
    name = 'PostRefactoring1612772420626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."enum_reportingWindow_belongsToType" RENAME TO "enum_reportingWindow_belongsToType_old"`);
        await queryRunner.query(`CREATE TYPE "enum_reportingWindow_belongsToType" AS ENUM('global', 'operation', 'operationCluster', 'plan', 'governingEntity')`);
        await queryRunner.query(`ALTER TABLE "reporting_window" ALTER COLUMN "belongsToType" TYPE "enum_reportingWindow_belongsToType" USING "belongsToType"::"text"::"enum_reportingWindow_belongsToType"`);
        await queryRunner.query(`DROP TYPE "enum_reportingWindow_belongsToType_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "reporting_window"."belongsToType" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "reporting_window"."belongsToType" IS NULL`);
        await queryRunner.query(`CREATE TYPE "enum_reportingWindow_belongsToType_old" AS ENUM()`);
        await queryRunner.query(`ALTER TABLE "reporting_window" ALTER COLUMN "belongsToType" TYPE "enum_reportingWindow_belongsToType_old" USING "belongsToType"::"text"::"enum_reportingWindow_belongsToType_old"`);
        await queryRunner.query(`DROP TYPE "reporting_window_belongstotype_enum"`);
        await queryRunner.query(`ALTER TYPE "enum_reportingWindow_belongsToType_old" RENAME TO  "enum_reportingWindow_belongsToType"`);
    }

}
