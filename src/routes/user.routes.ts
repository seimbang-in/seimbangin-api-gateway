import { Router } from "express";
import { UserController } from "../controllers/user";
import { authenticateJWT } from "../middleware/jwt";
import { multerUpload } from "../utils/googleCloudStorageHelper";

const userRouter = Router();

userRouter.get("/profile", authenticateJWT, UserController.detail);

userRouter.post(
  "/upload-pfp",
  authenticateJWT,
  multerUpload.single("photo"),
  UserController.uploadPfp,
);

userRouter.put("/", authenticateJWT, UserController.update);

export default userRouter;
