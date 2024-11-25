import { Request, Response } from "express";
import db from "../db";
import { transactionsTable, usersTable } from "../db/schema";
import { validationResult } from "express-validator";
import { count, eq } from "drizzle-orm";
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

export const transactionController = {
  create: async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { type, category, amount, description } = req.body;

    const user = await db.query.usersTable.findFirst({
      where: (user, { eq }) => eq(user.id, req.user.id),
    });

    if (!user) {
      res.status(404).send({
        status: "error",
        message: "User not found",
      });
      return;
    }

    const balance = parseFloat(user.balance);
    const transactionAmount = parseFloat(amount);

    if (type == 1 && balance < transactionAmount) {
      res.status(400).send({
        status: "error",
        message: "Insufficient balance",
        data: {
          balance: user.balance,
          amount,
        },
      });
      return;
    }

    try {
      await db.insert(transactionsTable).values({
        user_id: req.user.id,
        type,
        category,
        amount,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newBalance = createNewBalance({
        type,
        amount,
        balance: user.balance,
      });

      const balanceUpdate = await updateBalance({
        newBalance,
        userId: req.user.id,
      });

      if (!balanceUpdate.success) {
        res.status(500).send({
          status: "error",
          message: "Error creating transaction",
        });
        return;
      }

      res.send({
        status: "success",
        message: "Transaction created successfully",
        data: {
          user_id: req.user.id,
          balance: newBalance,
          type,
          category,
          amount,
          description,
        },
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: "Error creating transaction",
        error: error,
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

    const totalData = await db
      .select({ count: count() })
      .from(transactionsTable)
      .then((data) => {
        return Number(data[0].count);
      });

    createResponse.success({
      res,
      message: "Transactions retrieved successfully",
      data: transactions,
      meta: {
        currentPage: page || 1,
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

      createResponse.success({
        res,
        message: "Transaction deleted successfully",
        data: {
          amount: transaction.amount,
          balance: newBalance,
        },
      });
    } catch (error) {
      createResponse.error({
        res,
        status: 500,
        message: "Error deleting transaction",
      });
      return;
    }
  },
};
