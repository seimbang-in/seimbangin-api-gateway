import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import { Request, Response } from "express";
import db from "../db";
import { transactionsTable, userFinancial, usersTable } from "../db/schema";
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
          phone_number: usersTable.phone,
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

      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Query for this month's income
        const thisMonthIncomeQuery = await db
          .select({
            this_month_income: sql<number>`SUM(${transactionsTable.amount})`
          })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.type, 0),
              eq(transactionsTable.user_id, userId),
              gte(transactionsTable.createdAt, startOfMonth),
              lt(transactionsTable.createdAt, startOfNextMonth)
            )
          );

        // Query for this month's outcome
        const thisMonthOutcomeQuery = await db
          .select({
            this_month_outcome: sql<number>`SUM(${transactionsTable.amount})`
          })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.type, 1),
              eq(transactionsTable.user_id, userId),
              gte(transactionsTable.createdAt, startOfMonth),
              lt(transactionsTable.createdAt, startOfNextMonth)
            )
          );

        // Query for total income (all time)
        const totalIncomeQuery = await db
          .select({
            total_income: sql<number>`SUM(${transactionsTable.amount})`
          })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.type, 0),
              eq(transactionsTable.user_id, userId)
            )
          );

        // Query for total outcome (all time)
        const totalOutcomeQuery = await db
          .select({
            total_outcome: sql<number>`SUM(${transactionsTable.amount})`
          })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.type, 1),
              eq(transactionsTable.user_id, userId)
            )
          );

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
          phone_number,
        } = user;

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
            phone_number: phone_number || null,
            finance_profile: {
              monthly_income: finance_profile ? finance_profile.monthly_income || null : null,
              current_savings: finance_profile ? finance_profile.current_savings || null : null,
              debt: finance_profile ? finance_profile.debt || null : null,
              financial_goals: finance_profile ? finance_profile.financial_goals || null : null,
              risk_management: finance_profile ? finance_profile.risk_management || null : null,
              total_income: totalIncomeQuery[0]?.total_income || 0,
              total_outcome: totalOutcomeQuery[0]?.total_outcome || 0,
              this_month_income: thisMonthIncomeQuery[0]?.this_month_income || 0,
              this_month_outcome: thisMonthOutcomeQuery[0]?.this_month_outcome || 0
            },
          }
        });
      } catch (error) {
        res.send({
          status: "error",
          message: "An error occurred while fetching the user's financial data",
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

    const { full_name,  balance, username, email, university, gender, birth_date, phone } = req.body;

    // Hitung umur otomatis dari birth_date
    let age: number | null = null;
    if (birth_date) {
      const birth = new Date(birth_date);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const isBeforeBirthday =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
      
      if (isBeforeBirthday) {
        age--;
      }
    }
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
