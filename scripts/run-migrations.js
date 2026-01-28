import knex from "knex";
import config from "../knexfile.ts";

const db = knex(config);

async function run() {
  try {
    await db.migrate.latest();
    console.log("Migrations completed");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await db.destroy();
  }
}

run();
