import axios from "axios";
import { createResponse } from "../utils/response";
import { Request, Response } from "express";
import { ADVISOR_URL } from "../static/url";
import db from "../db";
import { transactionsTable, userFinancial, chatHistoryTable, usersTable } from "../db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import dayjs from "dayjs";
import { openai } from "../utils/openai";

/**
 * Type definition for the user data structure that matches schema
 */
type UserFinancialProfile = {
  id: number;
  full_name: string;
  age: number | null;
  balance: string | number;
  username: string;
  email: string;
  profilePicture: string | null;
  university: string | null;
  gender: "male" | "female" | "other" | null;
  birth_date: Date | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  phone_number: string | null;
  finance_profile: {
    monthly_income: string | number | null;
    current_savings: string | number | null;
    debt: string | number | null;
    financial_goals: string | null;
    total_income: string | number | null;
    total_outcome: string | number | null;
    risk_management: "low" | "medium" | "high" | null;
    this_month_income: string | number | null;
    this_month_outcome: string | number | null;
  } | null;
};

/**
 * Function to get comprehensive user data including financial profile
 */
async function getUserFullProfile(userId: number): Promise<UserFinancialProfile | null> {
  try {
    const userData = await db
      .select({
        id: usersTable.id,
        full_name: usersTable.full_name,
        age: usersTable.age,
        balance: usersTable.balance,
        username: usersTable.username,
        email: usersTable.email,
        profilePicture: usersTable.profilePicture,
        university: usersTable.university,
        gender: usersTable.gender,
        birth_date: usersTable.birth_date,
        created_at: usersTable.createdAt,
        updated_at: usersTable.updatedAt,
        phone_number: usersTable.phone,
        finance_profile: {
          monthly_income: userFinancial.monthly_income,
          current_savings: userFinancial.current_savings,
          debt: userFinancial.debt,
          financial_goals: userFinancial.financial_goals,
          total_income: userFinancial.total_income,
          total_outcome: userFinancial.total_outcome,
          risk_management: userFinancial.risk_management,
          this_month_income: sql<number | null>`0`,
          this_month_outcome: sql<number | null>`0`,
        },
      })
      .from(usersTable)
      .leftJoin(userFinancial, eq(usersTable.id, userFinancial.user_id))
      .where(eq(usersTable.id, userId))
      .then((rows) => rows[0] || null);

    if (!userData) {
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Function to get this month's income and expenses
 */
async function getThisMonthFinancials(userId: number) {
  const now = dayjs();
  const startOfMonth = now.startOf('month').toDate();
  const endOfMonth = now.endOf('month').toDate();
  
  try {
    // Get this month's transactions
    const transactions = await db
      .select({
        amount: transactionsTable.amount,
        type: transactionsTable.type,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          gte(transactionsTable.createdAt, startOfMonth),
          lt(transactionsTable.createdAt, endOfMonth)
        )
      );
    
    // Calculate income and outcome based on type (0 for income, 1 for outcome)
    let thisMonthIncome = 0;
    let thisMonthOutcome = 0;
    
    transactions.forEach(transaction => {
      const amount = Number(transaction.amount || 0);
      if (transaction.type === 0) {
        thisMonthIncome += amount;
      } else if (transaction.type === 1) {
        thisMonthOutcome += amount;
      }
    });
    
    return { thisMonthIncome, thisMonthOutcome };
  } catch (error) {
    console.error("Error getting this month's financials:", error);
    return { thisMonthIncome: 0, thisMonthOutcome: 0 };
  }
}

/**
 * Function to get financial advice from GPT based on user's financial data
 */
const getGPTAdvice = async (userProfile: UserFinancialProfile) => {
  // Extract and format financial data for better advice
  const finance = userProfile.finance_profile;
  
  if (!finance) {
    return "Please complete your financial profile to get personalized advice.";
  }
  
  // Convert string values to numbers for calculation
  const monthlyIncome = Number(finance.monthly_income || 0);
  const currentSavings = Number(finance.current_savings || 0);
  const debt = Number(finance.debt || 0);
  const thisMonthIncome = Number(finance.this_month_income || 0);
  const thisMonthOutcome = Number(finance.this_month_outcome || 0);
  const totalIncome = Number(finance.total_income || 0);
  const totalOutcome = Number(finance.total_outcome || 0);
  const balance = Number(userProfile.balance || 0);
  
  // Calculate some financial ratios
  const savingsRatio = monthlyIncome > 0 ? (currentSavings / monthlyIncome).toFixed(2) : "0";
  const debtToIncome = monthlyIncome > 0 ? (debt / (monthlyIncome * 12)).toFixed(2) : "0";
  const monthlySpendingRatio = monthlyIncome > 0 ? (thisMonthOutcome / monthlyIncome).toFixed(2) : "0";
  const emergencyFundMonths = monthlyIncome > 0 ? (currentSavings / monthlyIncome).toFixed(1) : "0";
  
  // Add age-appropriate context
  const ageContext = userProfile.age ? `${userProfile.age} years old` : "age unknown";
  const userGoals = finance.financial_goals || "Not specified";
  
  // Check if user has mentioned crypto interests
  const hasCryptoInterest = userGoals.toLowerCase().includes("crypto") || 
                           userGoals.toLowerCase().includes("bitcoin") ||
                           userGoals.toLowerCase().includes("invest");

  // Format data for GPT prompt
  const financialData = {
    personalInfo: {
      name: userProfile.full_name,
      age: userProfile.age,
      gender: userProfile.gender,
      ageContext: ageContext
    },
    financialStatus: {
      monthlyIncome: monthlyIncome,
      thisMonthIncome: thisMonthIncome,
      thisMonthExpenses: thisMonthOutcome,
      currentSavings: currentSavings,
      currentDebt: debt,
      currentBalance: balance,
      totalHistoricalIncome: totalIncome,
      totalHistoricalExpenses: totalOutcome,
    },
    financialMetrics: {
      savingsToIncomeRatio: savingsRatio,
      debtToIncomeRatio: debtToIncome,
      monthlySpendingRatio: monthlySpendingRatio,
      emergencyFundMonths: emergencyFundMonths
    },
    preferences: {
      riskTolerance: finance.risk_management || "low",
      financialGoals: userGoals,
      hasCryptoInterest: hasCryptoInterest
    }
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personalized financial advisor for users of a personal finance app.

Your task is to provide helpful, specific financial advice based on the user's detailed financial profile. 
Address the user by name and consider their age, financial goals, risk tolerance, and current financial situation.

IMPORTANT GUIDELINES:
- Be specific about their actual numbers - refer to their monthly income, savings, and debt
- If their emergency fund is less than 3-6 months of expenses, prioritize this advice
- If they have high-interest debt (assume credit cards), suggest paying this off before investing
- If the user is interested in cryptocurrency investments, provide balanced advice about responsible crypto investing, emphasizing that it should be only a small part (5-10% maximum) of their overall investment strategy due to volatility

Format your response in 1 clear and compact paragraphs:
1. A personalized greeting with their name and brief summary of their current financial situation
2. 2-3 specific and actionable recommendations based on their unique situation
3. A forward-looking statement about how these actions can help achieve their financial goals

Keep your advice practical, specific to their numbers, and easy to implement.`
        },
        {
          role: "user",
          content: `Please provide financial advice based on my profile: ${JSON.stringify(financialData)}`
        }
      ],
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error getting GPT advice:", error);
    return "We're sorry, but we couldn't generate personalized advice at this time. Please try again later.";
  }
};

/**
 * Save advice to user's chat history
 */
const saveAdviceToHistory = async (userId: number, advice: string) => {
  try {
    // Using a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete previous advisor messages for this user
      await tx
        .delete(chatHistoryTable)
        .where(
          and(
            eq(chatHistoryTable.user_id, userId),
            eq(chatHistoryTable.sender, "advisor")
          )
        );

      // Save new advice
      await tx.insert(chatHistoryTable).values({
        user_id: userId,
        message: advice,
        sender: "advisor",
        created_at: new Date()
      });
    });
    
    return true;
  } catch (error) {
    console.error("Error saving advice to history:", error);
    return false;
  }
};

export const advisorController = {
  getAdvice: async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return createResponse.error({
          res,
          message: "User not authenticated",
          status: 401,
          data: {}
        });
      }

      // Get complete user profile with financial data
      const userProfile = await getUserFullProfile(user.id);
      
      if (!userProfile) {
        return createResponse.error({
          res,
          message: "User profile not found",
          status: 404,
          data: {}
        });
      }
      
      if (!userProfile.finance_profile) {
        return createResponse.success({
          res,
          message: "Financial profile not complete",
          data: "Please complete your financial profile first"
        });
      }

      // Get this month's financials
      const { thisMonthIncome, thisMonthOutcome } = await getThisMonthFinancials(user.id);
      
      if (userProfile.finance_profile) {
        userProfile.finance_profile.this_month_income = thisMonthIncome;
        userProfile.finance_profile.this_month_outcome = thisMonthOutcome;
      }

      // Get advice from GPT
      const advice = await getGPTAdvice(userProfile);

      if (!advice) {
        return createResponse.error({
          res,
          message: "Unable to generate financial advice",
          status: 500,
          data: {}
        });
      }

      // Save advice to chat history
      const saveResult = await saveAdviceToHistory(user.id, advice);
      
      if (!saveResult) {
        console.warn(`Failed to save advice to history for user ${user.id}`);
      }

      return createResponse.success({
        res,
        message: "Financial advice generated successfully",
        data: advice
      });
    } catch (error) {
      console.error("Error in advisor controller:", error);
      return createResponse.error({
        res,
        message: "An error occurred while generating advice",
        status: 500,
        data: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  },
  
  /**
   * Get user's previous financial advice
   */
  getPreviousAdvice: async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return createResponse.error({
          res,
          message: "User not authenticated",
          status: 401,
          data: {}
        });
      }
      
      // Get the latest advice from chat history
      const latestAdvice = await db
        .select({
          message: chatHistoryTable.message,
          created_at: chatHistoryTable.created_at
        })
        .from(chatHistoryTable)
        .where(
          and(
            eq(chatHistoryTable.user_id, user.id),
            eq(chatHistoryTable.sender, "advisor")
          )
        )
        .orderBy(sql`${chatHistoryTable.created_at} DESC`)
        .limit(1)
        .then(rows => rows[0] || null);
        
      if (!latestAdvice) {
        return createResponse.success({
          res,
          message: "No previous advice found",
          data: null
        });
      }
      
      return createResponse.success({
        res, 
        message: "Previous advice retrieved successfully",
        data: {
          advice: latestAdvice.message,
          timestamp: latestAdvice.created_at
        }
      });
    } catch (error) {
      console.error("Error getting previous advice:", error);
      return createResponse.error({
        res,
        message: "Failed to retrieve previous advice",
        status: 500,
        data: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  }
};