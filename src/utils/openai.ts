import OpenAI from "openai";
export const openai = new OpenAI();

import fs from "fs";
import { Express } from "express";

export const saveUploadedFile = async (file?: Express.Multer.File): Promise<string> => {
  if (!file) {
    throw new Error("Please upload a file");
  }

  const filePath = file.path;
  if (!fs.existsSync(filePath)) {
    throw new Error("Uploaded file not found");
  }

  return filePath;
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
