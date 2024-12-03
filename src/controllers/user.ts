import { Request, Response } from "express";
import { gcsHelper } from "../utils/googleCloudStorageHelper";
import db from "../db";
import { transactionsTable, userFinancial, usersTable } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export const UserController = {
  detail: async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).send({
        status: "error",
        message: "User ID is missing",
      });
      return;
    }

    try {
      const user = await db
        .select({
          id: usersTable.id,
          full_name: usersTable.full_name,
          age: usersTable.age,
          balance: usersTable.balance,
          username: usersTable.username,
          email: usersTable.email,
          profilePicture: usersTable.profilePicture,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          finance_profile: {
            monthly_income: userFinancial.monthly_income,
            current_savings: userFinancial.current_savings,
            debt: userFinancial.debt,
            financial_goals: userFinancial.financial_goals,
            risk_management: userFinancial.risk_management,
          },
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .leftJoin(userFinancial, eq(usersTable.id, userFinancial.user_id))
        .then((rows) => rows[0]);

      // const thisMonthIncome = await db.select().from(transactionsTable).where({
      //   user_id: userId,
      //   type: "income",
      // });

      try {
        const thisMonthIncome = await db.execute(sql`
          SELECT AVG(amount) AS average_income
          FROM transactions
          WHERE type = 0
            AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            AND created_at < DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01');`);

        res.send({
          status: "success",
          data: { ...user, thisMonthIncome: thisMonthIncome[0] },
        });
      } catch (error) {
        res.send({
          status: "error",
          message: "An error occurred while fetching the user's income",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({
        status: "error",
        message: "An error occurred while fetching the user",
      });
    }
  },

  uploadPfp: async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).send({
        status: "error",
        message: "User ID is missing",
      });
      return;
    }

    if (!userId) {
      res.status(400).send({
        status: "error",
        message: "Please provide a user ID",
      });

      return;
    }

    const photo = req.file;

    if (!photo) {
      res.status(400).send({
        status: "error",
        message: "Please upload a file",
        file: photo,
      });

      return;
    }

    try {
      const fileUrl = await gcsHelper.uploadFile({
        file: photo,
        folder: "profile-pictures",
      });

      await db
        .update(usersTable)
        .set({ profilePicture: fileUrl, updatedAt: new Date() })
        .where(eq(usersTable.id, parseInt(userId)));

      res.send({
        status: "success",
        data: {
          url: fileUrl,
        },
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).send({
        status: "error",
        message: "An error occurred while uploading the file",
      });

      return;
    }
  },

  update: async (req: Request, res: Response) => {
    const userId = req.user.id;

    const { full_name, age, balance, username, email } = req.body;

    const payload = {
      full_name,
      age,
      balance,
      username,
      email,
    };

    try {
      await db
        .update(usersTable)
        .set(payload)
        .where(eq(usersTable.id, parseInt(userId)));
      res.send({
        status: "success",
        message: "User updated successfully",
        data: payload,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        status: "error",
        message: "An error occurred while updating the user",
      });
    }
  },
};
