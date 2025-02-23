import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// database configuration
const host = process.env.DB_HOST || "127.0.0.1";
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "";
const database = process.env.DB_NAME || "db_seimbangin";

// Cek apakah MySQL butuh SSL atau tidak
const sslConfig =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;

// create a connection pool
export const poolConnection = mysql.createPool({
  host,
  user,
  password,
  database,
  multipleStatements: true,
  ssl: sslConfig, // Hanya pakai SSL jika DB_SSL=true
});

// create a drizzle instance
const db = drizzle(poolConnection, { schema, mode: "default" });

export default db;
