import { Request, Response } from "express";
import db from "../db";
import { userFinancial, chatHistoryTable } from "../db/schema";
import { eq, sql, and } from "drizzle-orm";
import { createResponse } from "../utils/response";
import { openai } from "../utils/openai";

// Fungsi untuk mendapatkan konteks relevan dari advisor dan bot
const getRelevantContext = async (userId: number) => {
  const advisorMessages = await db
    .select()
    .from(chatHistoryTable)
    .where(
      and(
        eq(chatHistoryTable.user_id, userId),
        eq(chatHistoryTable.sender, "advisor")
      )
    )
    .orderBy(sql`created_at asc`);

  if (advisorMessages.length === 0) {
    return null;
  }

  const lastAdvisorMessage = advisorMessages[advisorMessages.length - 1];

  const afterAdvisorBotMessages = await db
    .select()
    .from(chatHistoryTable)
    .where(
      and(
        eq(chatHistoryTable.user_id, userId),
        eq(chatHistoryTable.sender, "bot"),
        sql`created_at > ${lastAdvisorMessage.created_at}`
      )
    )
    .orderBy(sql`created_at asc`);

  return {
    lastAdvisorMessage: lastAdvisorMessage.message,
    botHistory: afterAdvisorBotMessages.map((msg) => msg.message),
  };
};

// Fungsi untuk menyimpan pesan dari bot ke chat history
const saveBotMessageToHistory = async (userId: number, message: string) => {
  await db.insert(chatHistoryTable).values({
    user_id: userId,
    message,
    sender: "bot",
    created_at: new Date(),
  });
};

// Fungsi untuk mendapatkan respons dari chatbot
const getChatbotResponse = async (userId: number, userMessage: string) => {
  const userProfile = await db
    .select()
    .from(userFinancial)
    .where(eq(userFinancial.user_id, userId));

  if (userProfile.length === 0) {
    return "I don't have enough financial information to provide advice.";
  }

  const lastAdvice = await getRelevantContext(userId);

  const prompt = lastAdvice
    ? `Here is the last advice from your financial advisor: "${lastAdvice.lastAdvisorMessage}".\n` +
      `Then, based on the following assistant history: "${lastAdvice.botHistory.join("\n")}", ` +
      `now the user says: "${userMessage}". Please continue the advice accordingly.`
    : `User says: "${userMessage}". Start helping them with their financial goals.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a financial assistant helping users manage money wisely. make sure to provide accurate and helpful advice. Keep the conversation in 1 paragraf.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 50,
  });

  const chatbotReply = completion.choices[0].message.content ?? "Sorry, I couldn't generate a response.";

  await saveBotMessageToHistory(userId, chatbotReply);

  return chatbotReply;
};

// Controller utama
export const chatbotController = {
  chat: async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
      return createResponse.error({
        res,
        message: "User is not authenticated",
        status: 401,
        data: {},
      });
    }

    const { message } = req.body;

    if (!message) {
      return createResponse.error({
        res,
        message: "Message is required",
        status: 400,
        data: {},
      });
    }

    try {

      const chatbotResponse = await getChatbotResponse(user.id, message);

      createResponse.success({
        res,
        message: "Chatbot response",
        data: {
          reply: chatbotResponse,
        },
      });
    } catch (error) {
      console.error("Error in chatbot:", error);
      return createResponse.error({
        res,
        message: "Error while getting chatbot response",
        status: 500,
        data: {},
      });
    }
  },

  getHistory: async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
      return createResponse.error({
        res,
        message: "User is not authenticated",
        status: 401,
        data: {},
      });
    }

    try {
      const chatHistory = await db
        .select()
        .from(chatHistoryTable)
        .where(eq(chatHistoryTable.user_id, user.id))
        .orderBy(sql`created_at desc`);

      createResponse.success({
        res,
        message: "Chat history retrieved successfully",
        data: chatHistory,
      });
    } catch (error) {
      console.error("Error getting chat history:", error);
      return createResponse.error({
        res,
        message: "Error retrieving chat history",
        status: 500,
        data: {},
      });
    }
  },
};
