import {
  bigint,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ENUM untuk kategori transaksi
const transactionCategoryEnums = mysqlEnum("category", [
  "food",
  "transportation",
  "utilities",
  "entertainment",
  "shopping",
  "healthcare",
  "education",
  "others",
]);

const riskManagementEnums = mysqlEnum("risk_management", ["low", "medium", "high"]);

// TABEL USERS
export const usersTable = mysqlTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  role: int("role").notNull().default(0), // 0 = user, 1 = admin
  full_name: varchar("full_name", { length: 255 }).notNull(),
  age: int("age").notNull().default(17),
  balance: decimal("balance", { precision: 16, scale: 2 }).notNull().default("0.00"),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Hanya jika login via email/password
  googleId: varchar("google_id", { length: 255 }).unique(), // Google OAuth ID
  profilePicture: varchar("profile_picture", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// TABEL USER FINANCIAL PROFILE
export const userFinancial = mysqlTable("user_financial_profile", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint("user_id", { mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  monthly_income: decimal("monthly_income", { precision: 16, scale: 2 }),
  current_savings: decimal("current_savings", { precision: 16, scale: 2 }),
  debt: decimal("debt", { precision: 16, scale: 2 }),
  financial_goals: text("financial_goals"),
  risk_management: riskManagementEnums("risk_management"),
});

// TABEL TRANSAKSI
export const transactionsTable = mysqlTable("transactions", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint("user_id", { mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull().default("Transaction"),
  type: int("type").notNull().default(0), // 0 = expense, 1 = income
  amount: decimal("amount", { precision: 16, scale: 2 }).notNull().default("0.00"),
  category: transactionCategoryEnums("category").default("others"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// TABEL ITEM TRANSAKSI
export const itemsTable = mysqlTable("transaction_items", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  transaction_id: bigint("transaction_id", { mode: "number" })
    .references(() => transactionsTable.id)
    .notNull(),
  item_name: text("item_name").notNull(),
  category: transactionCategoryEnums("category").default("others"),
  price: decimal("price", { precision: 16, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 16, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// RELASI TRANSAKSI <-> ITEM
export const transactionRelations = relations(transactionsTable, ({ one }) => ({
  items: one(itemsTable, {
    fields: [transactionsTable.id],
    references: [itemsTable.transaction_id],
  }),
}));

export const itemsRelation = relations(itemsTable, ({ one }) => ({
  transactionsTable: one(transactionsTable, {
    fields: [itemsTable.transaction_id],
    references: [transactionsTable.id],
  }),
}));
