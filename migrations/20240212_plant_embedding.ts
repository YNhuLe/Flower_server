export async function up(knex: any) {
  await knex.schema.alterTable("plants", (table:any) => {
    table.specificType("plant_embedding", "vector(768)");
  });
}

export async function down(knex: any) {
  await knex.schema.alterTable("plants", (table:any) => {
    table.dropColumn("plant_embedding");
  });
}
