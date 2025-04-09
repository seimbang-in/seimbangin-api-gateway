import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import db from "../db";
import { articles } from "../db/schema";
import { gcsHelper } from "../utils/googleCloudStorageHelper";
import { createResponse } from "../utils/response";


const articleController = {
    create: async (req: Request, res: Response) => {
        const { title, content, slug } = req.body;
        const thumbnail = req.file;

        if (!title || !content || !thumbnail || !slug) {
            createResponse.error({
                res,
                status: 400,
                message: "Title, content, thumbnail and slug are required",
            });
            return;
        }

        try {
            const thumbnailUrl = await gcsHelper.uploadFile({
                file: thumbnail,
                folder: "articles-thumbnails",
            });

            try {
                const [articleId] = await db.insert(articles).values({ title, content, thumbnailUrl, slug }).$returningId();

                createResponse.success({
                    res,
                    message: "Article created successfully",
                    data: {
                        id: articleId.id,
                        title,
                        content,
                        thumbnailUrl,
                        slug,
                    }
                });

                return;

            } catch (error) {
                console.error(error, "ERROR");
                res.status(500).send({
                    status: "error",
                    message: "An error occurred while creating the article",
                });

                return;
            }
        } catch (error) {
            console.error(error, "ERROR");

            createResponse.error({
                res,
                status: 500,
                message: "An error occurred while uploading the thumbnail",
            });

            return;
        }
    },
    getAll: async (req: Request, res: Response) => {
        try {
            const articlesList = await db.select().from(articles);
            createResponse.success({
                res,
                message: "Articles fetched successfully",
                data: articlesList,
            });
            return;
        } catch (error) {
            console.error(error, "ERROR");
            createResponse.error({
                res,
                status: 500,
                message: "An error occurred while fetching the articles",
            });
            return;
        }
    },
    getById: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            createResponse.error({
                res,
                status: 400,
                message: "Article ID is required",
            });

            return;
        }

        try {
            const article = await db.select().from(articles).where(eq(articles.id, parseInt(id)));

            if (article.length === 0) {
                createResponse.error({
                    res,
                    status: 404,
                    message: "Article not found",
                });

                return;
            }

            createResponse.success({
                res,
                message: "Article fetched successfully",
                data: article[0],
            });

            return;
        } catch (error) {
            console.error(error, "ERROR");
            createResponse.error({
                res,
                status: 500,
                message: "An error occurred while fetching the article",
            });
            return;
        }
    },
    getBySlug: async (req: Request, res: Response) => {
        const { slug } = req.params;

        if (!slug) {
            createResponse.error({
                res,

                status: 400,
                message: "Article slug is required",
            });

            return;
        }

        try {
            const article = await db.select().from(articles).where(eq(articles.slug, slug));

            if (article.length === 0) {
                createResponse.error({
                    res,
                    status: 404,
                    message: "Article not found",
                });

                return;
            }

            createResponse.success({
                res,
                message: "Article fetched successfully",
                data: article[0],
            });

            return;
        } catch (error) {
            console.error(error, "ERROR");
            createResponse.error({
                res,
                status: 500,
                message: "An error occurred while fetching the article",
            });
            return;
        }
    },
    update: async (req: Request, res: Response) => {
        const { id } = req.params;
        const { title, content, slug } = req.body;
        const thumbnail = req.file;

        if (!id) {
            createResponse.error({
                res,
                status: 400,
                message: "Article ID is required",
            });

            return;
        }

        if (!title || !content || !slug) {
            createResponse.error({
                res,
                status: 400,
                message: "Title, content and slug are required",
            });

            return;
        }

        try {
            let thumbnailUrl = null;

            if (thumbnail) {
                thumbnailUrl = await gcsHelper.uploadFile({
                    file: thumbnail,
                    folder: "articles-thumbnails",
                });
            }

            const updatedArticle = await db.update(articles).set({ title, content, slug, thumbnailUrl }).where(eq(articles.id, parseInt(id)));

            createResponse.success({
                res,
                message: "Article updated successfully",
                data: updatedArticle,
            });

            return;
        } catch (error) {
            console.error(error, "ERROR");
            createResponse.error({
                res,
                status: 500,
                message: "An error occurred while updating the article",
            });
            return;
        }
    },
    delete: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            createResponse.error({
                res,
                status: 400,
                message: "Article ID is required",
            });

            return;
        }

        try {
            await db.delete(articles).where(eq(articles.id, parseInt(id)));

            createResponse.success({
                res,
                message: "Article deleted successfully",
            });

            return;
        } catch (error) {
            console.error(error, "ERROR");
            createResponse.error({
                res,
                status: 500,
                message: "An error occurred while deleting the article",
            });
            return;
        }
    }
}
export default articleController;
