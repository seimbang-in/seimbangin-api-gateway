import { Router } from "express";
import articleController from "../controllers/articles";
import { authenticateAdminJWT } from "../middleware/jwt";
import { multerUpload } from "../utils/googleCloudStorageHelper";

const articleRouter = Router();

articleRouter.post('/', authenticateAdminJWT, multerUpload.single('thumbnail'), articleController.create);
articleRouter.get('/', articleController.getAll);
articleRouter.get('/:id', articleController.getById);
articleRouter.put('/:id', authenticateAdminJWT, multerUpload.single('thumbnail'), articleController.update);
articleRouter.delete('/:id', authenticateAdminJWT, articleController.delete);
// slug
articleRouter.get('/:slug', articleController.getBySlug);

export default articleRouter;