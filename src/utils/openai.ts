import OpenAI from "openai";
export const openai = new OpenAI();

import fs from "fs";
import { Express } from "express";
import path from "path"; 
import { v4 as uuidv4 } from "uuid";
export const saveUploadedFile = async (file?: Express.Multer.File): Promise<string> => {
  if (!file || !file.buffer) {
    throw new Error("Uploaded file not found");
  }

  const tempDir = path.join(__dirname, "..", "..", "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const tempPath = path.join(tempDir, `${uuidv4()}-${file.originalname}`);

  await fs.promises.writeFile(tempPath, file.buffer);

  return tempPath;
};

export const deleteFile = async (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("⚠️ Failed to delete file:", err);
    } else {
      console.log("🗑️ File deleted:", filePath);
    }
  });
};