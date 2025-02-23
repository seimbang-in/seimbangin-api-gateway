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

// Enum untuk kategori transaksi
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

// 🏠 Tabel User
export const usersTable = mysqlTable("users", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  role: int().notNull().default(0), // 0 = user, 1 = admin
  full_name: varchar("full_name", { length: 255 }).notNull(),
  age: int().notNull().default(17),
  balance: decimal("balance", { precision: 16, scale: 2 }).notNull().default("0.00"),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  profilePicture: varchar("profile_picture", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow().notNull(),
});

// 📈 Tabel Profil Keuangan User
export const userFinancial = mysqlTable("user_financial_profile", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint({ mode: "number" })
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  monthly_income: decimal("monthly_income", { precision: 16, scale: 2 }),
  current_savings: decimal("current_savings", { precision: 16, scale: 2 }),
  debt: decimal("debt", { precision: 16, scale: 2 }),
  financial_goals: text("financial_goals"),
  risk_management: riskManagementEnums,
});

// 💰 Tabel Transaksi
export const transactionsTable = mysqlTable("transactions", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  user_id: bigint({ mode: "number" })
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull().default("Transaction"),
  type: int("type").notNull().default(0), // 0 = pengeluaran, 1 = pemasukan
  amount: decimal("amount", { precision: 16, scale: 2 }).notNull().default("0.00"),
  category: transactionCategoryEnums.default("others"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow().notNull(),
});

// 🛒 Tabel Item dalam Transaksi
export const itemsTable = mysqlTable("transaction_items", {
  id: bigint({ mode: "number" }).primaryKey().autoincrement(),
  transaction_id: bigint({ mode: "number" })
    .references(() => transactionsTable.id, { onDelete: "cascade" })
    .notNull(),
  item_name: text("item_name").notNull(),
  category: transactionCategoryEnums.default("others"),
  price: decimal("price", { precision: 16, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 16, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow().notNull(),
});

// 🔗 Relasi
export const transactionRelations = relations(transactionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [transactionsTable.user_id],
    references: [usersTable.id],
  }),
  items: many(itemsTable),
}));

export const itemsRelation = relations(itemsTable, ({ one }) => ({
  transaction: one(transactionsTable, {
    fields: [itemsTable.transaction_id],
    references: [transactionsTable.id],
  }),
}));
