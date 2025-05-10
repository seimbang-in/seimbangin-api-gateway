import { Request, Response } from "express";
import db from "../db";
import { userFinancial, chatHistoryTable, usersTable } from "../db/schema";
import { eq, sql, and, desc, gte } from "drizzle-orm";
import { createResponse } from "../utils/response";
import { openai } from "../utils/openai";

// Type definitions for better type safety
type ChatMessage = {
  id: number;
  user_id: number;
  message: string;
  sender: "advisor" | "bot" | "user";
  created_at: Date;
};

type UserContext = {
  lastAdvisorMessage: string;
  botHistory: string[];
  userFinancialProfile: UserFinancialProfile | null;
};

type UserFinancialProfile = {
  monthly_income: string | null;
  current_savings: string | null;
  debt: string | null;
  financial_goals: string | null;
  risk_management: "low" | "medium" | "high" | null;
  total_income: string | null;
  total_outcome: string | null;
};

/**
 * Gets the relevant conversation context for the chatbot
 * Including the last advisor message and subsequent bot messages
 */
const getRelevantContext = async (userId: number): Promise<UserContext | null> => {
  try {
    // Get the most recent advisor message
    const advisorMessage = await db
      .select({
        id: chatHistoryTable.id,
        message: chatHistoryTable.message,
        created_at: chatHistoryTable.created_at
      })
      .from(chatHistoryTable)
      .where(
        and(
          eq(chatHistoryTable.user_id, userId),
          eq(chatHistoryTable.sender, "advisor")
        )
      )
      .orderBy(desc(chatHistoryTable.created_at))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!advisorMessage) {
      // Get user's financial profile if no advisor message exists
      const userProfile = await getUserFinancialProfile(userId);
      return {
        lastAdvisorMessage: "",
        botHistory: [],
        userFinancialProfile: userProfile
      };
    }

    // Get bot messages after the last advisor message
    const afterAdvisorBotMessages = await db
      .select({
        message: chatHistoryTable.message
      })
      .from(chatHistoryTable)
      .where(
        and(
          eq(chatHistoryTable.user_id, userId),
          eq(chatHistoryTable.sender, "bot"),
          advisorMessage.created_at
            ? gte(chatHistoryTable.created_at, advisorMessage.created_at)
            : undefined
        )
      )
      .orderBy(sql`created_at asc`);

    // Get user's financial profile
    const userProfile = await getUserFinancialProfile(userId);

    return {
      lastAdvisorMessage: advisorMessage.message,
      botHistory: afterAdvisorBotMessages.map(msg => msg.message),
      userFinancialProfile: userProfile
    };
  } catch (error) {
    console.error("Error getting chat context:", error);
    return null;
  }
};

/**
 * Gets the user's financial profile for context
 */
const getUserFinancialProfile = async (userId: number): Promise<UserFinancialProfile | null> => {
  try {
    const profile = await db
      .select({
        monthly_income: userFinancial.monthly_income,
        current_savings: userFinancial.current_savings,
        debt: userFinancial.debt,
        financial_goals: userFinancial.financial_goals,
        risk_management: userFinancial.risk_management,
        total_income: userFinancial.total_income,
        total_outcome: userFinancial.total_outcome
      })
      .from(userFinancial)
      .where(eq(userFinancial.user_id, userId))
      .then(rows => rows[0] || null);
    
    return profile;
  } catch (error) {
    console.error("Error getting user financial profile:", error);
    return null;
  }
};

/**
 * Gets the user's name for personalized responses
 */
const getUserName = async (userId: number): Promise<string> => {
  try {
    const user = await db
      .select({
        full_name: usersTable.full_name
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .then(rows => rows[0] || null);
    
    return user?.full_name || "";
  } catch (error) {
    console.error("Error getting user name:", error);
    return "";
  }
};

/**
 * Saves a message from the bot to chat history
 */
const saveBotMessageToHistory = async (userId: number, message: string): Promise<boolean> => {
  try {
    await db.insert(chatHistoryTable).values({
      user_id: userId,
      message,
      sender: "bot",
      created_at: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error saving bot message:", error);
    return false;
  }
};

/**
 * Saves a message from the user to chat history
 * Note: Based on schema, we need to modify this as the schema only allows "advisor" or "bot" as sender
 * To track user messages, we'll need to use "advisor" or create a special function
 * 
 * This function is kept in the code but not used directly due to schema limitations
 */
const saveUserMessageToHistory = async (userId: number, message: string): Promise<boolean> => {
  try {
    // Note: This would require schema modification to work properly
    // For now, we track user messages in memory or application logic
    console.log(`User ${userId} message: ${message}`); // Log for debugging
    return true;
  } catch (error) {
    console.error("Error handling user message:", error);
    return false;
  }
};

/**
 * Gets a response from the chatbot based on user input and context
 */
const getChatbotResponse = async (userId: number, userMessage: string): Promise<string> => {
  try {
    // Get user's name for personalization
    const userName = await getUserName(userId);
    
    // Get conversation context
    const context = await getRelevantContext(userId);
    
    if (!context) {
      return "I'm having trouble accessing your information. Please try again later.";
    }

    // Create a more informative prompt with financial context
    let prompt = "";
    
    if (context.lastAdvisorMessage) {
      prompt += `Here is the last advice from the financial advisor: "${context.lastAdvisorMessage}".\n\n`;
    }
    
    if (context.botHistory.length > 0) {
      prompt += `Previous conversation:\n${context.botHistory.join("\n")}\n\n`;
    }
    
    // Add financial profile context if available
    if (context.userFinancialProfile) {
      const profile = context.userFinancialProfile;
      prompt += "User financial profile:\n";
      prompt += `- Monthly income: ${profile.monthly_income || "Not specified"}\n`;
      prompt += `- Current savings: ${profile.current_savings || "Not specified"}\n`;
      prompt += `- Debt: ${profile.debt || "Not specified"}\n`;
      prompt += `- Total income (historical): ${profile.total_income || "Not specified"}\n`;
      prompt += `- Total outcome (historical): ${profile.total_outcome || "Not specified"}\n`;
      prompt += `- Financial goals: ${profile.financial_goals || "Not specified"}\n`;
      prompt += `- Risk management preference: ${profile.risk_management || "Not specified"}\n\n`;
    }
    
    prompt += `"User says": "${userMessage}"\n\nProvide a helpful response:`;

    // Call OpenAI with improved system prompt for financial chatbot
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a slang and helpful financial assistant chatbot named FinBot. 
          
Your goal is to help users understand their finances better and provide practical advice.

Guidelines:
- don't call name of user in the response
- use multi language support, including English and indonesian base on user preference
- Keep responses compact/short answers before user asks for more details
- Keep it less than 50 words if user ask for details ignore this
- Avoid unnecessary markdown formatting, asterisks, or special characters
- Ask clarifying questions when user intent is unclear
- Acknowledge the user's financial situation from their profile
- If the user asks something outside financial topics, gently redirect to financial matters
- Provide actionable tips that match their financial goals and risk tolerance
- When encountering unclear financial goals, suggest setting specific, measurable goals
- If user has debt, prioritize debt management advice over investment unless they specifically ask about investing

Remember to be encouraging and positive about their financial journey.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const chatbotReply = completion.choices[0].message.content ?? 
      "I'm sorry, I couldn't generate a response. Please try again.";

    return chatbotReply;
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
};

/**
 * Main controller for handling chatbot functionality
 */
export const chatbotController = {
  /**
   * Handles user chat messages and returns chatbot responses
   */
  chat: async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || !user.id) {
      return createResponse.error({
        res,
        message: "User is not authenticated",
        status: 401,
        data: {}
      });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return createResponse.error({
        res,
        message: "Valid message is required",
        status: 400,
        data: {}
      });
    }

    try {
      // Log user message (not saved to DB due to schema constraints)
      console.log(`User ${user.id} message: ${message}`);
      
      // Get chatbot response
      const chatbotResponse = await getChatbotResponse(user.id, message);
      
      // Save bot response to history
      await saveBotMessageToHistory(user.id, chatbotResponse);

      return createResponse.success({
        res,
        message: "Chatbot response",
        data: {
          reply: chatbotResponse,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error("Error in chatbot:", error);
      return createResponse.error({
        res,
        message: "Error while getting chatbot response",
        status: 500,
        data: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  },

  /**
   * Returns chat history for the user
   */
  getHistory: async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || !user.id) {
      return createResponse.error({
        res,
        message: "User is not authenticated",
        status: 401,
        data: {}
      });
    }

    try {
      // Get pagination parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatHistoryTable)
        .where(eq(chatHistoryTable.user_id, user.id))
        .then(result => result[0]?.count || 0);
      
      // Get paginated chat history
      const chatHistory = await db
        .select({
          id: chatHistoryTable.id,
          message: chatHistoryTable.message,
          sender: chatHistoryTable.sender,
          created_at: chatHistoryTable.created_at
        })
        .from(chatHistoryTable)
        .where(eq(chatHistoryTable.user_id, user.id))
        .orderBy(desc(chatHistoryTable.created_at))
        .limit(limit)
        .offset(offset);

      return createResponse.success({
        res,
        message: "Chat history retrieved successfully",
        data: {
          history: chatHistory,
          pagination: {
            total: totalCount,
            limit,
            offset
          }
        }
      });
    } catch (error) {
      console.error("Error getting chat history:", error);
      return createResponse.error({
        res,
        message: "Error retrieving chat history",
        status: 500,
        data: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  },
  
  /**
   * Clears the user's chat history
   */
  clearHistory: async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || !user.id) {
      return createResponse.error({
        res,
        message: "User is not authenticated",
        status: 401,
        data: {}
      });
    }

    try {
      // Only clear bot messages, preserve advisor messages
      await db
        .delete(chatHistoryTable)
        .where(
          and(
            eq(chatHistoryTable.user_id, user.id),
            eq(chatHistoryTable.sender, "bot")
          )
        );

      return createResponse.success({
        res,
        message: "Chat history cleared successfully",
        data: { 
          clearedAt: new Date(),
          status: "success"
        }
      });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      return createResponse.error({
        res,
        message: "Error clearing chat history",
        status: 500,
        data: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  }
};