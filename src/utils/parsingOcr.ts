import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const EXTENDED_CATEGORIES = Object.freeze([
  "food",
  "transportation",,
  "entertainment",
  "shopping",
  "education",
  "health",
  "gift",
  "Parent",
  "Freelance",
  "salary",
  "bonus",
  "housing",
  "internet",
  "others"
]);

export type ExtendedCategory = typeof EXTENDED_CATEGORIES[number];

export const categories = EXTENDED_CATEGORIES.join(", ");

interface ReceiptItem {
  item_name: string;
  category: ExtendedCategory;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  store: string;
  date: string;
  items: ReceiptItem[];
  Discount: number;
  tax: number;
  total: number;
}

export const processOCRFromBuffer = async (buffer: Buffer): Promise<ReceiptData> => {
  const logPrefix = "🔍 [OCR Processor]";

  console.log(`${logPrefix} Buffer received, converting to base64...`);
  const base64Image = buffer.toString("base64");
  const imageData = `data:image/png;base64,${base64Image}`;

  console.log(`${logPrefix} Sending image to OpenAI...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expert OCR model that extracts receipt details.
Please return a valid JSON object with the following format:
{
  "store": "string",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "item_name": "string",
      "category": "string (choose one from: ${categories})",
      "quantity": int,
      "price": int
    }
  ],
  "Discount": int,
  "tax": int,
  "total": int
}`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract structured details from this receipt." },
          { type: "image_url", image_url: { url: imageData } },
        ],
      },
    ],
    max_tokens: 700,
    temperature: 0.2,
  });

  let rawText = response.choices[0]?.message?.content?.trim();

  if (!rawText) {
    console.error(`${logPrefix} ❌ No response received from OpenAI.`);
    throw new Error("No text extracted from image");
  }

  console.log(`${logPrefix} Raw text received, attempting to parse JSON...`);

  const jsonMatch = rawText.match(/```json\s*([\s\S]+?)\s*```/);
  if (jsonMatch) {
    rawText = jsonMatch[1];
  }

  try {
    const parsed: ReceiptData = JSON.parse(rawText);
    console.log(`${logPrefix} ✅ Successfully parsed OCR result.`);
    return parsed;
  } catch (err) {
    console.error(`${logPrefix} ❌ Failed to parse JSON:`);
    console.error(rawText);
    throw new Error("Failed to parse extracted JSON");
  }
};
