import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPgTrgmAndGameNameIndex1745591106667
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm extention in PostgreSQL
    await queryRunner.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    // Set the similarity threshold for pg_tgrm
    await queryRunner.query("SET pg_trgm.similarity_threshold = 0.25;");

    // add a GIN index on game.name for trigram searches
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS idx_game_name_trgm ON game USING GIN (name gin_trgm_ops);",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS idx_game_name_trgm;");

    await queryRunner.query("DROP EXTENSION IF EXISTS pg_trgm;");
  }
}
