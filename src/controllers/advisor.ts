import axios from "axios";
import { createResponse } from "../utils/response";
import { Request, Response } from "express";
import { ADVISOR_URL } from "../static/url";
import db from "../db";
import { transactionsTable, userFinancial } from "../db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import dayjs from "dayjs";

const parseToJSON = (input: string) => {
  const data = input.trim().split("\n"); // Menghapus spasi awal/akhir di input
  const result: { [key: string]: any } = {};

  data.forEach((line) => {
    const [key, ...valueParts] = line.split(":"); // Split dengan mempertimbangkan tanda ":"
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim().toLowerCase().replace(/ /g, "_"); // Mengubah key menjadi snake_case
      const trimmedValue = valueParts.join(":").trim(); // Menggabungkan kembali jika value ada ":" di dalamnya

      if (
        trimmedKey === "income" ||
        trimmedKey === "outcome" ||
        trimmedKey === "debt" ||
        trimmedKey === "current_savings"
      ) {
        // Parsing numeric value
        const numericValue = trimmedValue.replace(/[^0-9]/g, ""); // Hapus semua karakter non-numeric
        result[trimmedKey] = parseInt(numericValue, 10);
      } else {
        // Untuk value non-numeric langsung simpan
        result[trimmedKey] = trimmedValue;
      }
    }
  });

  return result;
};

async function getMonthlyOutcome(userId: number) {
  const startOfMonth = dayjs().startOf("month").toDate();
  const startOfNextMonth = dayjs().add(1, "month").startOf("month").toDate();

  const result = await db
    .select({
      totalOutcome: sql`SUM(${transactionsTable.amount})`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.user_id, userId), // Filter berdasarkan user ID
        eq(transactionsTable.type, 1), // Filter outcome
        gte(transactionsTable.createdAt, startOfMonth), // Awal bulan
        lt(transactionsTable.createdAt, startOfNextMonth), // Sebelum bulan berikutnya
      ),
    );

  return result[0]?.totalOutcome || 0;
}

async function getMonthlyIncome(userId: number) {
  const startOfMonth = dayjs().startOf("month").toDate();
  const startOfNextMonth = dayjs().add(1, "month").startOf("month").toDate();

  const result = await db
    .select({
      totalOutcome: sql`SUM(${transactionsTable.amount})`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.user_id, userId),
        eq(transactionsTable.type, 1),
        gte(transactionsTable.createdAt, startOfMonth),
        lt(transactionsTable.createdAt, startOfNextMonth),
      ),
    );

  return result[0]?.totalOutcome || 0;
}

const getAdvice = async (payload: any) => {
  try {
    const response = await axios.post(`${ADVISOR_URL}/advisor/advice`, payload);

    const data = response.data;

    return data.financial_advice;
  } catch (error) {
    console.log(error, "ERROR");
    return null;
  }
};

export const advisorController = {
  getAdvice: async (req: Request, res: Response) => {
    // get user data
    const user = req.user;

    // get user financial profile
    const financeProfile = await db
      .select()
      .from(userFinancial)
      .where(eq(user.id, userFinancial.user_id));

    if (financeProfile.length === 0) {
      createResponse.error({
        res,
        message: "Error Getting User Financial Profile",
        status: 500,
        data: {},
      });
      return;
    }

    // count this month outcome
    const outcome = await getMonthlyOutcome(user.id);
    const income = await getMonthlyIncome(user.id);

    const payload = {
      monthly_income: income,
      outcome: outcome,
      saving: financeProfile[0].current_savings,
      debt: financeProfile[0].debt,
      risk_management: financeProfile[0].risk_management,
      financial_goals: financeProfile[0].financial_goals,
    };

    const advice = await getAdvice(payload);

    if (!advice) {
      createResponse.error({
        res,
        message: "Error Getting Advice",
        status: 500,
        data: {},
      });
      return;
    }

    createResponse.success({
      res,
      message: "Advice retrieved successfully",
      data: advice,
    });

    return;
  },
};
