import { Request, Response } from "express";
import { createResponse } from "../utils/response";
import { processOCRFromBuffer } from "../utils/parsingOcr";

const logPrefix = "🧾 [OCR Controller]";

const ocrController = {
  post: async (req: Request, res: Response) => {
    try {
      console.log(`${logPrefix} Received OCR request`);

      const file = req.file;
      if (!file) {
        console.warn(`${logPrefix} No file uploaded`);
        return createResponse.error({
          res,
          status: 400,
          message: "No file uploaded. Please upload an image of the receipt.",
        });
      }

      const supportedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!supportedMimeTypes.includes(file.mimetype)) {
        console.warn(`${logPrefix} Unsupported file type: ${file.mimetype}`);
        return createResponse.error({
          res,
          status: 415,
          message: "Unsupported file type. Please upload a PNG or JPEG image.",
        });
      }

      console.info(`${logPrefix} Processing file:`, {
        name: file.originalname,
        mimetype: file.mimetype,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      });

      const parsedData = await processOCRFromBuffer(file.buffer);
      console.info(`${logPrefix} OCR successful`);

      return createResponse.success({
        res,
        message: "Receipt data successfully extracted.",
        data: parsedData,
      });

    } catch (error) {
      console.error(`${logPrefix} OCR processing error`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error occurred during OCR";

      return createResponse.error({
        res,
        status: 500,
        message: errorMessage,
      });
    }
  },
};

export default ocrController;
