import { sql } from "drizzle-orm";
import {
  bigint, boolean, date,
  datetime,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar
} from "drizzle-orm/mysql-core";

const transactionCategoryEnums = mysqlEnum("category", [
  // old category
  "food",
  "transportation",
  "utilities",
  "entertainment",
  "shopping",
  "healthcare",
  "education",
  "others",
  // new category
  "health",
  "gift",
  "entertain",
  "Parent",
  "Freelance",
  "salary",
  "bonus",
  "housing",
  "internet",
]);

const riskManagementEnums = mysqlEnum("risk_management", [
  "low",
  "medium",
  "high",
]);

const genderEnums = mysqlEnum("gender", ["male", "female", "other"]);

// user table schema
export const usersTable = mysqlTable("users", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  role: int().notNull().default(0).notNull(), // 0 for user, 1 for admin
  full_name: varchar({ length: 255 }).notNull(),
  age: int(),
  phone: varchar({ length: 15 }).unique(), //
  balance: decimal({ precision: 16, scale: 2 }).notNull().default("0.0"),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }),
  googleId: varchar({ length: 255 }).unique(),
  profilePicture: varchar("profile_picture", { length: 256 }),

  // Onboarding
  gender: genderEnums.default("other"),
  birth_date: date(),
  university: varchar({ length: 255 }), // Optional

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
  debt: decimal({ precision: 16, scale: 2 }).default("0.0"),
  financial_goals: text(),
  total_income: decimal({ precision: 16, scale: 2 }).default("0.0"),
  total_outcome: decimal({ precision: 16, scale: 2 }).default("0.0"),
  risk_management: riskManagementEnums,
});

export const transactionsTable = mysqlTable("transactions", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint({ mode: "number" })
    .references(() => usersTable.id)
    .notNull(),
  name: varchar({ length: 255 }).notNull().default("Transaction"),
  type: int().notNull().default(0),  // 0 for income, 1 for outcome
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

export const articles = mysqlTable('articles', {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 255 }),
  publishedAt: datetime('published_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  isPublished: boolean('is_published').default(true),
});

export const chatHistoryTable = mysqlTable("chat_history", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull(),
  message: varchar("message", { length: 1000 }).notNull(),
  sender: mysqlEnum("sender", ["advisor", "bot"]).notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// export const transactionRelations = relations(transactionsTable, ({ one }) => ({
//   items: one(itemsTable, {
//     fields: [transactionsTable.id],
//     references: [itemsTable.transaction_id],
//   }),
// }));

// export const itemsRelation = relations(itemsTable, ({ one }) => ({
//   transactionsTable: one(transactionsTable, {
//     fields: [itemsTable.transaction_id],
//     references: [transactionsTable.id],
//   }),
// }));
