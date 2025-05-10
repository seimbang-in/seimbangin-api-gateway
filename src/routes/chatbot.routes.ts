import { Router } from "express";
import { chatbotController } from "../controllers/chatbot";
import { authenticateJWT } from "../middleware/jwt";
const router = Router();

router.post("/", authenticateJWT, chatbotController.chat);
router.get("/history", authenticateJWT, chatbotController.getHistory);
router.get("/clear/history", authenticateJWT, chatbotController.clearHistory);

export default router;
