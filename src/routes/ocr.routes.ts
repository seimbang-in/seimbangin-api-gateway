import { Router } from "express";

import authenticateJWT from "../middleware/jwt";
import multimodalController from "../controllers/ocr";
import { multerUpload } from "../utils/googleCloudStorageHelper";

const ocrRouter = Router();

ocrRouter.post(
  "/",
  authenticateJWT,
  multerUpload.single("photo"),
  multimodalController.post,
);

ocrRouter.get("/api-key", authenticateJWT, multimodalController.get);

export default ocrRouter;