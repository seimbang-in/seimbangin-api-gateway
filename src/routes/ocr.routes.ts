import express from "express";
import { multerUpload } from "../utils/localStorageHelper";
import ocrController from "../controllers/ocr";

const router = express.Router();

// Endpoint untuk upload gambar dan OCR
router.post("/upload", multerUpload.single("photo"), ocrController.post);

export default router;