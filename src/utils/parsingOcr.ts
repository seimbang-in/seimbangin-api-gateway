import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const EXTENDED_CATEGORIES = [
  "food",
  "transportation",
  "utilities",
  "entertainment",
  "shopping",
  "healthcare",
  "education",
  "others",
] as const;

export type ExtendedCategory = (typeof EXTENDED_CATEGORIES)[number];
export const categories = EXTENDED_CATEGORIES.join(", ");

export const processOCR = async (filePath: string) => {
  console.log("✅ File found, converting to Base64...");

  const imageBase64 = fs.readFileSync(filePath).toString("base64");
  const imageData = `data:image/png;base64,${imageBase64}`;

  console.log("🚀 Sending image to OpenAI...");

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `Extract structured details from the receipt image. 
Return a valid JSON object with:
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

  let extractedText = response.choices[0]?.message?.content?.trim() || "";

  if (!extractedText) {
    throw new Error("No text extracted from image");
  }

  console.log("📄 Extracted text received.");

  // Handle if response in code block markdown
  const jsonMatch = extractedText.match(/```json\s*([\s\S]+?)\s*```/);
  if (jsonMatch) {
    extractedText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(extractedText);
    console.log("✅ Successfully parsed OCR result.");
    return parsed;
  } catch (error) {
    console.error("❌ Failed to parse extracted JSON:");
    console.error(extractedText); // Log full response for debugging
    throw new Error("Failed to parse extracted JSON");
  }
};