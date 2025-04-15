import { and, count, sql } from "drizzle-orm";
import { eq } from "drizzle-orm/mysql-core/expressions";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import db from "../db";
import { itemsTable, transactionsTable, userFinancial, usersTable } from "../db/schema";
import { createResponse } from "../utils/response";

const createNewBalance = ({
  type,
  amount,
  balance,
}: {
  type: number;
  amount: string;
  balance: string;
}): string => {
  const newBalance =
    type == 0
      ? Number(balance) + Number(amount)
      : Number(balance) - Number(amount);

  return newBalance.toString();
};

const updateBalance = async ({ newBalance, userId }: any) => {
  try {
    await db
      .update(usersTable)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    return { success: true, message: "Balance updated successfully" };
  } catch (error) {
    return { success: false, message: "Error updating balance" };
  }
};
async function updateUserIncomeOutcome(userId: number) {
  try {
    const income = await db.select({ sum: sql`SUM(amount)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.user_id, userId), eq(transactionsTable.type, 1)));

    const outcome = await db.select({ sum: sql`SUM(amount)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.user_id, userId), eq(transactionsTable.type, 0)));

    await db.update(userFinancial)
      .set({
        total_income: (Number(income[0].sum) || 0).toString(),
        total_outcome: (Number(outcome[0].sum) || 0).toString(),
      })
      .where(eq(userFinancial.user_id, userId));

    return { success: true, message: "Income and outcome updated successfully" };
  } catch (error) {
    console.error("Error updating income and outcome:", error);
    return { success: false, message: "Error updating income and outcome" };
  }

}

export const transactionController = {
  create: async (req: Request, res: Response) => {
    // Validasi Request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      createResponse.error({
        res,
        status: 422,
        message: "Validation error",
      });
      return;
    }

    const { type, description, items, category } = req.body;

    // Validasi Items
    if (!Array.isArray(items) || items.length === 0) {
      createResponse.error({
        res,
        status: 400,
        message: "Items must be an array and cannot be empty",
      });

      return;
    }

    // Ambil data user dari database
    const user = await db.query.usersTable.findFirst({
      where: (user, { eq }) => eq(user.id, req.user.id),
    });

    if (!user) {
      createResponse.error({
        res,
        status: 404,
        message: "User not found",
      });
      return;
    }

    const balance = parseFloat(user.balance);

    // Hitung Total Amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );

    if (type === 1 && balance < totalAmount) {
      createResponse.error({
        res,
        status: 400,
        message: "Insufficient balance",
      });

      return;
    }

    try {
      // Buat Transaksi Baru
      const [transactionId] = await db
        .insert(transactionsTable)
        .values({
          user_id: req.user.id,
          type,
          description,
          category: category || "others",
          amount: `${totalAmount}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .$returningId();

      // Simpan Items ke transactionItemsTable
      const itemsData = items.map((item: any) => ({
        transaction_id: transactionId.id,
        item_name: item.item_name,
        category: item.category,
        price: `${item.price}`,
        quantity: item.quantity,
        subtotal: `${item.price * item.quantity}`,
      }));

      await db.insert(itemsTable).values(itemsData);

      // Update Balance User
      const newBalance = createNewBalance({
        type,
        amount: `${totalAmount}`,
        balance: user.balance,
      });

      const balanceUpdate = await updateBalance({
        newBalance,
        userId: req.user.id,
      });

      if (!balanceUpdate.success) {
        createResponse.error({
          res,
          status: 500,
          message: "Error updating user balance",
        });

        return;
      }

      // Update User Income and Outcome
      const incomeOutcomeUpdate = await updateUserIncomeOutcome(req.user.id);
      if (!incomeOutcomeUpdate.success) {
        createResponse.error({
          res,
          status: 500,
          message: "Error updating user income and outcome",
        });

        return;
      }

      // Kirim Response Sukses
      res.status(201).send({
        status: "success",
        message: "Transaction created successfully",
        data: {
          transaction_id: transactionId,
          totalAmount,
          balance: newBalance,
          items,
        },
      });

      return;
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).send({
        status: "error",
        message: "Error creating transaction",
      });

      return;
    }
  },

  getAll: async (req: Request, res: Response) => {
    // get query params
    const { limit, page } = req.query;

    const offset =
      limit && page ? Number(limit) * (Number(page) - 1) : undefined;
    const userId = req.user.id;

    const transactions = await db.query.transactionsTable.findMany({
      where: (transaction, { eq }) => eq(transaction.user_id, userId),
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    const transactionIds = transactions.map((t) => t.id);

    // Ambil items secara terpisah
    const items = await db.query.itemsTable.findMany({
      where: (item, { inArray }) =>
        inArray(item.transaction_id, transactionIds),
    });

    const transactionsWithItems = transactions.map((transaction) => ({
      ...transaction,
      items:
        items.filter((item) => item.transaction_id === transaction.id) || [],
    }));

    const totalData = await db
      .select({ count: count() })
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, userId))
      .then((data) => {
        return Number(data[0].count);
      });

    createResponse.success({
      res,
      message: "Transactions retrieved successfully",
      data: transactionsWithItems,
      meta: {
        currentPage: Number(page) || 1,
        limit: Number(limit) || transactions.length,
        totalItems: totalData,
        totalPages: Math.ceil(
          totalData / (Number(limit) || transactions.length),
        ),
        hasNextPage:
          totalData >
          (Number(limit) || transactions.length) * (Number(page) || 1),
        hasPreviousPage: Number(page) > 1,
      },
    });
  },

  delete: async (req: Request, res: Response) => {
    const transactionId = Number(req.params.id);

    const transaction = await db.query.transactionsTable.findFirst({
      where: (transaction, { eq }) => eq(transaction.id, transactionId),
    });

    if (!transaction) {
      createResponse.error({
        res,
        status: 404,
        message: "Transaction not found",
      });
      return;
    }

    try {
      const transactionType = transaction.type == 0 ? 1 : 0;

      const userBalance = await db.query.usersTable.findFirst({
        where: (user, { eq }) => eq(user.id, req.user.id),
      });

      const newBalance = createNewBalance({
        type: transactionType,
        amount: transaction.amount,
        balance: userBalance?.balance || "0",
      });

      // delete transcation items
      await db
        .delete(itemsTable)
        .where(eq(itemsTable.transaction_id, transactionId));

      // delete transaction
      await db
        .delete(transactionsTable)
        .where(eq(transactionsTable.id, transactionId));

      // if transaction type is income, subtract amount from balance
      const balanceUpdate = await updateBalance({
        newBalance,
        userId: req.user.id,
      });

      if (!balanceUpdate.success) {
        createResponse.error({
          res,
          status: 500,
          message: "Error deleting transaction",
        });
        return;
      }

      // Update User Income and Outcome
      const incomeOutcomeUpdate = await updateUserIncomeOutcome(req.user.id);
      if (!incomeOutcomeUpdate.success) {
        createResponse.error({
          res,
          status: 500,
          message: "Error updating user income and outcome",
        });
        return;
      }

      createResponse.success({
        res,
        message: "Transaction deleted successfully",
        data: {
          amount: transaction.amount,
          balance: newBalance,
        },
      });
    } catch (error) {
      console.log("ERROR", error);
      createResponse.error({
        res,
        status: 500,
        message: "Error deleting transaction",
      });
      return;
    }
  },
};
