import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// database configuration
const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
import * as schema from "./schema";

// create a connection pool
export const poolConnection = mysql.createPool({
  host: host || "",
  user: user || "",
  password: password || "",
  database: database || "",
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false,
  },
});

// create a drizzle instance
const db = drizzle(poolConnection, { schema, mode: "default" });

export default db;
