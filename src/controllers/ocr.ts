import { Request, Response } from "express";
import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createResponse } from "../utils/response";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ocrController = {
  post: async (req: Request, res: Response) => {
    try {
      console.log("🖼️ Processing OCR...");

      // Periksa apakah ada file yang diunggah
      const photo = req.file;
      if (!photo) {
        return createResponse.error({
          status: 400,
          res,
          message: "Please upload a file",
        });
      }

      console.log("📂 File uploaded:", photo.path);

      // Periksa apakah file ada di sistem
      if (!fs.existsSync(photo.path)) {
        console.error("❌ File not found after upload!");
        return createResponse.error({
          status: 500,
          res,
          message: "Uploaded file not found",
        });
      }

      console.log("✅ File found, converting to Base64...");

      // Baca file sebagai Base64
      const imageBase64 = fs.readFileSync(photo.path).toString("base64");
      const imageData = `data:image/png;base64,${imageBase64}`;

      console.log("🚀 Sending image to OpenAI...");

      // Kirim ke OpenAI GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-2024-04-09",
        messages: [
          { role: "system", content: "Extract text from the receipt image and return itemized details with prices." },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Extract the text from this receipt." },
              { type: "image_url", image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 500,
      });

      // Ambil hasil ekstraksi teks
      const extractedText = response.choices[0]?.message?.content || "No text extracted";

      console.log("✅ OCR Success!");
      createResponse.success({
        res,
        message: "OCR data retrieved successfully",
        data: extractedText,
      });

    } catch (error) {
      console.error("❌ ERROR processing OCR:", error);
      createResponse.error({
        status: 500,
        res,
        message: "Failed to process receipt",
      });
    }
  },
};

export default ocrController;
