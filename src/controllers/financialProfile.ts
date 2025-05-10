import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import db from "../db";
import { userFinancial, usersTable } from "../db/schema";
import { createResponse } from "../utils/response";

export const financialProfileController = {
  update: async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // check if the user already has a financial profile
    const user = await db
      .select()
      .from(usersTable)
      .leftJoin(userFinancial, eq(usersTable.id, userFinancial.user_id))
      .where(eq(usersTable.id, req.user.id));

    // if user don't have a financial profile, create one
    if (!user || !user.length || !user[0].user_financial_profile) {
      console.log("User does not have a financial profile, creating one...");
      await db.insert(userFinancial).values({
        user_id: req.user.id,
      });
    }

    const {
      monthly_income,
      current_savings,
      debt,
      financial_goals,
      risk_management,
    } = req.body;

    // check if payload have current_savings & debt then convert to decimal
    let parsedCurrentSavings = current_savings;
    if (current_savings) {
      parsedCurrentSavings = parseFloat(current_savings);
    }

    let parsedDebt = debt;
    if (debt) {
      parsedDebt = parseFloat(debt);
    }

    try {
      await db
        .update(userFinancial)
        .set({
          monthly_income,
          current_savings: parsedCurrentSavings,
          debt: parsedDebt,
          financial_goals,
          risk_management,
        })
        .where(eq(userFinancial.user_id, req.user.id));

      createResponse.success({
        res,
        message: "Financial profile created successfully",
        data: {
          monthly_income,
          current_savings,
          debt,
          financial_goals,
          risk_management,
        },
      });
    } catch (error) {
      createResponse.error({
        res,
        status: 500,
        message: "An error occurred while creating the financial profile" + error,
      });
    }
  },
};
