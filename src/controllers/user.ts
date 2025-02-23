import { Request, Response } from "express";
import db from "../db";
import { usersTable, userFinancial } from "../db/schema";
import { eq } from "drizzle-orm";

export const UserController = {
  // Ambil data user
  detail: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ status: "error", message: "User ID is missing" });
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

      if (!user) {
        res.status(404).json({ status: "error", message: "User not found" });
        return;
      }

      res.status(200).json({ status: "success", data: user });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "An error occurred while fetching user details",
      });
    }
  },

  // Upload foto profil
  uploadPfp: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ status: "error", message: "User ID is missing" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ status: "error", message: "No file uploaded" });
      return;
    }

    try {
      const filePath = `/uploads/${req.file.filename}`;
      await db
        .update(usersTable)
        .set({ profilePicture: filePath })
        .where(eq(usersTable.id, userId));

      res.status(200).json({
        status: "success",
        message: "Upload successful",
        filePath,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Upload failed",
      });
    }
  },

  // Update user profile
  update: async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { full_name, age, balance, username, email } = req.body;

    try {
      await db
        .update(usersTable)
        .set({ full_name, age, balance, username, email })
        .where(eq(usersTable.id, userId));

      res.status(200).json({
        status: "success",
        message: "User updated successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "An error occurred while updating the user",
      });
    }
  },
};
