import { addMonths, format, startOfMonth, subMonths, startOfWeek } from "date-fns";
import { sql } from "drizzle-orm";
import { Request, Response } from "express";
import db from "../db";
import { transactionsTable,itemsTable } from "../db/schema";
import { createResponse } from "../utils/response";

export const statisticController = {
    getTotalIncomeHistory: async (req: Request, res: Response) => {
        try {
            // Get the last 5 months (including current month)
            const currentDate = new Date();
            const fiveMonthsAgo = startOfMonth(subMonths(currentDate, 4));
            
            // Create array with all 5 months we want to display
            const last5Months = [];
            for (let i = 0; i < 5; i++) {
                const monthDate = addMonths(fiveMonthsAgo, i);
                const monthKey = format(monthDate, 'yyyy-MM');
                last5Months.push({
                    month: monthKey,
                    income: 0,
                    outcome: 0
                });
            }
            
            // Fetch all transactions from the last 5 months
            const transactions = await db
                .select({
                    amount: transactionsTable.amount,
                    type: transactionsTable.type,
                    createdAt: transactionsTable.createdAt,
                })
                .from(transactionsTable)
                .where(sql`${transactionsTable.createdAt} >= ${fiveMonthsAgo}`);

            // Map transactions to our prepared months structure
            const monthlyData = transactions.reduce((acc, transaction) => {
                if (!transaction.createdAt) return acc;
                
                const transactionDate = new Date(transaction.createdAt);
                const monthKey = format(transactionDate, 'yyyy-MM');
                
                // Find the month in our array
                const monthIndex = acc.findIndex(item => item.month === monthKey);
                if (monthIndex !== -1) {
                    if (transaction.type === 0) {
                        acc[monthIndex].income += Number(transaction.amount);
                    } else if (transaction.type === 1) {
                        acc[monthIndex].outcome += Number(transaction.amount);
                    }
                }
                
                return acc;
            }, last5Months);

            createResponse.success({
                res,
                message: "Get total income history successfully",
                data: monthlyData
            });
        } catch (error) {
            console.log(error);
            createResponse.error({
                res,
                status: 400,
                message: "Failed to get total income history",
            });
        }
    },

getCategoryTransaction: async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return createResponse.error({
        res,
        status: 401,
        message: "Unauthorized",
      });
    }

    const period = req.query.period as 'day' | 'week' | 'month' | '6month' || 'month';

    let fromDate = new Date();
    switch (period) {
      case 'day':
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        fromDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'month':
        fromDate = startOfMonth(new Date());
        break;
      case '6month':
        fromDate = startOfMonth(subMonths(new Date(), 5));
        break;
    }

    const result = await db
      .select({
        category: transactionsTable.category,
        type: transactionsTable.type,
        total: sql`SUM(${transactionsTable.amount})`.as("total"),
        count: sql`COUNT(*)`.as("count"),
      })
      .from(transactionsTable)
      .where(sql`${transactionsTable.user_id} = ${userId} AND ${transactionsTable.createdAt} >= ${fromDate}`)
      .groupBy(transactionsTable.category, transactionsTable.type);

    const totalPerType: Record<number, number> = {};
    result.forEach(item => {
      const type = item.type;
      totalPerType[type] = (totalPerType[type] || 0) + Number(item.total);
    });

    const withPercentage = result.map((item) => {
      const typeTotal = totalPerType[item.type] || 0;
      const percentage = typeTotal > 0 ? Number(((Number(item.total) / typeTotal) * 100).toFixed(2)) : 0;
      return {
        category: item.category,
        type: item.type,
        total: Number(item.total),
        count: Number(item.count),
        percentage,
      };
    });

    const grouped = {
      income: withPercentage.filter(item => item.type === 0),
      outcome: withPercentage.filter(item => item.type === 1),
    };

    createResponse.success({
      res,
      message: "Get transaction category breakdown successfully",
      data: grouped,
    });
  } catch (error) {
    console.error(error);
    createResponse.error({
      res,
      status: 500,
      message: "Failed to get transaction category breakdown",
    });
  }
},
getCategoryItem: async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return createResponse.error({
        res,
        status: 401,
        message: "Unauthorized",
      });
    }

    const period = req.query.period as 'day' | 'week' | 'month' | '6month' || 'month';

    let fromDate = new Date();
    switch (period) {
      case 'day':
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        fromDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'month':
        fromDate = startOfMonth(new Date());
        break;
      case '6month':
        fromDate = startOfMonth(subMonths(new Date(), 5));
        break;
    }

    const result = await db
      .select({
        category: itemsTable.category,
        type: transactionsTable.type,
        total: sql`SUM(${itemsTable.subtotal})`.as("total"),
        count: sql`COUNT(*)`.as("count"),
      })
      .from(itemsTable)
      .innerJoin(
        transactionsTable,
        sql`${itemsTable.transaction_id} = ${transactionsTable.id}`
      )
      .where(sql`${transactionsTable.user_id} = ${userId} AND ${transactionsTable.createdAt} >= ${fromDate}`)
      .groupBy(itemsTable.category, transactionsTable.type);

    const totalPerType: Record<number, number> = {};
    result.forEach(item => {
      const type = item.type;
      totalPerType[type] = (totalPerType[type] || 0) + Number(item.total);
    });

    const withPercentage = result.map((item) => {
      const typeTotal = totalPerType[item.type] || 0;
      const percentage = typeTotal > 0 ? Number(((Number(item.total) / typeTotal) * 100).toFixed(2)) : 0;
      return {
        category: item.category,
        type: item.type,
        total: Number(item.total),
        count: Number(item.count),
        percentage,
      };
    });

    const grouped = {
      income: withPercentage.filter(item => item.type === 0),
      outcome: withPercentage.filter(item => item.type === 1),
    };

    createResponse.success({
      res,
      message: "Get item category breakdown successfully",
      data: grouped,
    });
  } catch (error) {
    console.error(error);
    createResponse.error({
      res,
      status: 500,
      message: "Failed to get item category breakdown",
    });
  }
}
};
