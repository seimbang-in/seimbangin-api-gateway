import { Router } from "express";
import articleController from "../controllers/articles";
import { multerUpload } from "../utils/googleCloudStorageHelper";

const articleRouter = Router();

articleRouter.post('/', multerUpload.single('thumbnail'), articleController.create);
articleRouter.get('/', articleController.getAll);
articleRouter.get('/:id', articleController.getById);
articleRouter.put('/:id', multerUpload.single('thumbnail'), articleController.update);
articleRouter.delete('/:id', articleController.delete);
// slug
articleRouter.get('/:slug', articleController.getBySlug);

export default articleRouter;