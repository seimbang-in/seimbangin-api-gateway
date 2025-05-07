import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { sql } from "drizzle-orm";
import { Request, Response } from "express";
import db from "../db";
import { transactionsTable } from "../db/schema";
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
    }
}