import { Router } from "express";
import { multerUpload } from "../utils/localStorageHelper";
import { UserController } from "../controllers/user";
import authenticateJWT from "../middleware/jwt";

const userRouter = Router();

// Ambil data user
userRouter.get("/profile", authenticateJWT, UserController.detail);

// Upload foto profil
userRouter.post(
  "/upload-pfp",
  authenticateJWT,
  multerUpload.single("photo"),
  UserController.uploadPfp
);

// Update data user
userRouter.put("/", authenticateJWT, UserController.update);

export default userRouter;
