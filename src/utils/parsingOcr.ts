import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const processOCR = async (filePath: string) => {
  console.log("✅ File found, converting to Base64...");

  // Konversi gambar ke Base64
  const imageBase64 = fs.readFileSync(filePath).toString("base64");
  const imageData = `data:image/png;base64,${imageBase64}`;

  console.log("🚀 Sending image to OpenAI...");

  // Kirim gambar ke OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `Extract structured details from the receipt image. 
                  Return a JSON object with:
                  {
                    "store": "string",
                    "date": "YYYY-MM-DD",
                    "items": [
                      {
                        "item_name": "string",
                        "category": "string",
                        "quantity": int,
                        "subprice": int,
                        "price": int
                      }
                    ],
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

  // Ambil teks hasil ekstraksi
  let extractedText = response.choices[0]?.message?.content?.trim() || "";
  if (!extractedText) {
    throw new Error("No text extracted from image");
  }

  console.log("📄 Extracted text received.");

  // Hapus format Markdown jika ada
  const jsonMatch = extractedText.match(/```json\n([\s\S]+)\n```/);
  if (jsonMatch) {
    extractedText = jsonMatch[1]; // Ambil hanya isi JSON tanpa kode blok
  }

  // Parsing JSON
  try {
    return JSON.parse(extractedText);
  } catch (error) {
    console.error("❌ Failed to parse extracted JSON:", error);
    throw new Error("Failed to parse extracted JSON");
  }
};
