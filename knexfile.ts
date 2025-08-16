import "dotenv/config";
import type { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST ?? (() => { throw new Error("DB_HOST is not defined"); })(),
    database: process.env.DB_NAME ?? (() => { throw new Error("DB_NAME is not defined"); })(),
    user: process.env.DB_USER ?? (() => { throw new Error("DB_USER is not defined"); })(),
    password: process.env.DB_PASSWORD ?? (() => { throw new Error("DB_PASSWORD is not defined"); })(),
    port: Number(process.env.DB_PORT) || 5432,
  },
  pool: { min: 2, max: 10 },
};

export default config;
