import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "mysql",

  dbCredentials: {
    host: host || "",
    user: user || "",
    password: password || "",
    database: database || "",
    port: 3306,
  },
});
