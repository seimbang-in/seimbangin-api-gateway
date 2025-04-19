import { eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import db from "../db";
import { userFinancial, usersTable } from "../db/schema";
import { gcsHelper } from "../utils/googleCloudStorageHelper";

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
          id: usersTable.id || "",
          full_name: usersTable.full_name || null,
          age: usersTable.age,
          balance: usersTable.balance,
          username: usersTable.username,
          email: usersTable.email,
          profilePicture: usersTable.profilePicture,
          university: usersTable.university,
          gender: usersTable.gender,
          birth_date: usersTable.birth_date,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          finance_profile: {
            monthly_income: userFinancial.monthly_income,
            current_savings: userFinancial.current_savings,
            debt: userFinancial.debt,
            financial_goals: userFinancial.financial_goals,
            risk_management: userFinancial.risk_management,
            total_income: userFinancial.total_income,
            total_outcome: userFinancial.total_outcome,
          },
        })
        .from(usersTable)
        .leftJoin(userFinancial, eq(usersTable.id, userFinancial.user_id))
        .where(eq(usersTable.id, userId))
        .then((rows) => rows[0] || {});

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
        const {
          age,
          balance,
          createdAt,
          email,
          birth_date,
          full_name,
          gender,
          id,
          profilePicture,
          university,
          username,
          updatedAt,
          finance_profile,
        } = user;

        console.log(user, "USER");

        res.send({
          status: "success",
          data: {
            id: id || null,
            full_name: full_name || null,
            age: age || null,
            balance: balance || null,
            username: username || null,
            email: email || null,
            profilePicture: profilePicture || null,
            university: university || null,
            gender: gender || null,
            birth_date: birth_date || null,
            created_at: createdAt || null,
            updated_at: updatedAt || null,
            finance_profile: {
              monthly_income: finance_profile ? finance_profile.monthly_income || null : null,
              current_savings: finance_profile ? finance_profile.current_savings || null : null,
              debt: finance_profile ? finance_profile.debt || null : null,
              financial_goals: finance_profile ? finance_profile.financial_goals || null : null,
              total_income: finance_profile ? finance_profile.total_income || null : null,
              total_outcome: finance_profile ? finance_profile.total_outcome || null : null,
              risk_management: finance_profile ? finance_profile.risk_management || null : null,
              this_month_income: (thisMonthIncome[0] as any)?.average_income || null,
            },
          }
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
      console.error(error, "ERROR");
      res.status(500).send({
        status: "error",
        message: "An error occurred while uploading the file",
      });

      return;
    }
  },

  update: async (req: Request, res: Response) => {
    const userId = req.user.id;

    const { full_name, age, balance, username, email, university, gender, birth_date, phone } = req.body;

    const payload = {
      full_name,
      age,
      balance,
      username,
      email,
      university,
      gender,
      phone,
      birth_date,
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
