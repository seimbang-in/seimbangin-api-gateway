import { Request, Response } from "express";
import { createResponse } from "../utils/response";
import { processOCR } from "../utils/parsingOcr";
import { saveUploadedFile, deleteFile } from "../utils/openai";

const ocrController = {
  post: async (req: Request, res: Response) => {
    let filePath: string | null = null;

    try {
      console.log("🖼️ Processing OCR...");

      // Simpan file yang diunggah
      filePath = await saveUploadedFile(req.file);
      console.log("📂 File uploaded:", filePath);

      // Proses OCR menggunakan OpenAI
      const parsedData = await processOCR(filePath);

      console.log("✅ OCR Success!");
      createResponse.success({
        res,
        message: "OCR data retrieved successfully",
        data: parsedData,
      });

    } catch (error) {
      console.error("❌ ERROR processing OCR:", error);
      createResponse.error({
        status: 500,
        res,
        message: error instanceof Error ? error.message : "Failed to process receipt",
      });

    } finally {
      // Hapus file setelah selesai diproses
      if (filePath) {
        await deleteFile(filePath);
      }
    }
  },
};

export default ocrController;
