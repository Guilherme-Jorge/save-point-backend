import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import * as path from "path";

export default (): PostgresConnectionOptions => ({
  // Postgres
  type: "postgres",

  host: process.env.POSTGRES_HOST || "db",
  port: +process.env.POSTGRES_PORT! || 5432,
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "savepoint",
  url:
    process.env.POSTGRES_URL ||
    `postgres://postgres:postgres@postgres:5432/savepoint`,

  entities: [path.resolve(__dirname, "..") + "/**/*.entity{.ts,.js}"],
  migrations: [path.resolve(__dirname, "..") + "/migrations/*{.ts,.js}"],
  migrationsRun: false,

  // If the Node.JS environment is production, don't use synchronize
  synchronize: process.env.NODE_ENV === "production" ? false : true,
});
