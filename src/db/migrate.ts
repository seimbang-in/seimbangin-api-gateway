import { migrate } from "drizzle-orm/mysql2/migrator";
import db, { poolConnection } from ".";

(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await poolConnection.end();
})();
