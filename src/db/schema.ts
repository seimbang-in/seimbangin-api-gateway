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
import { send } from "process";

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

const riskManagementEnums = mysqlEnum("risk_management", [
  "low",
  "medium",
  "high",
]);

// user table schema
export const usersTable = mysqlTable("users", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  role: int().notNull().default(0).notNull(), // 0 for user, 1 for admin
  full_name: varchar({ length: 255 }).notNull(),
  age: int().notNull().default(17),
  balance: decimal({ precision: 16, scale: 2 }).notNull().default("0.0"),
  username: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  profilePicture: varchar("profile_picture", { length: 256 }),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const userFinancial = mysqlTable("user_financial_profile", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint({ mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  monthly_income: decimal({ precision: 16, scale: 2 }),
  current_savings: decimal({ precision: 16, scale: 2 }),
  debt: decimal({ precision: 16, scale: 2 }),
  financial_goals: text(),
  risk_management: riskManagementEnums,
});

export const transactionsTable = mysqlTable("transactions", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint({ mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  name: varchar({ length: 255 }).notNull().default("Transaction"),
  type: int().notNull().default(0),
  amount: decimal().notNull().default("0.0"),
  category: transactionCategoryEnums.default("others"),
  description: text("description"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const itemsTable = mysqlTable("transaction_items", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  transaction_id: bigint({ mode: "number" })
    .references(() => transactionsTable.id)
    .notNull(),
  item_name: text("item_name").notNull(),
  category: transactionCategoryEnums.default("others"),
  price: decimal().notNull(),
  quantity: int().notNull(),
  subtotal: decimal().notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

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
