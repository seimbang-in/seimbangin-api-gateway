import { Request, Response } from "express";
import { createResponse } from "../utils/response";
import { processOCR } from "../utils/parsingOcr";
import { saveUploadedFile, deleteFile } from "../utils/openai";

const ocrController = {
  post: async (req: Request, res: Response) => {
    let filePath: string | null = null;

    try {
      console.log("🖼️ Processing OCR...");

      if (!req.file) {
        throw new Error("No file uploaded");
      }

      console.log("📎 Uploaded file info:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Simpan file ke local temp folder
      filePath = await saveUploadedFile(req.file);
      console.log("📂 File saved at:", filePath);

      // Proses OCR
      const parsedData = await processOCR(filePath);
      console.log("✅ OCR success!");

      return createResponse.success({
        res,
        message: "OCR data retrieved successfully",
        data: parsedData,
      });

    } catch (error) {
      console.error("❌ ERROR processing OCR:", error);

      return createResponse.error({
        status: 500,
        res,
        message: error instanceof Error ? error.message : "Failed to process receipt",
      });

    } finally {
      if (filePath) {
        await deleteFile(filePath);
      }
    }
  },
};

export default ocrController;