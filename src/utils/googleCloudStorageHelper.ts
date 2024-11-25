import multer from "multer";
import { bucket } from "../config/googleCloudStorageConfig";

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const bucketName = process.env.BUCKET_NAME || "";

interface GcsHelperParams {
  file: Express.Multer.File;
  folder: string;
}

const gcsHelper = {
  uploadFile: async ({ file, folder }: GcsHelperParams): Promise<string> => {
    return new Promise((resolve, reject) => {
      const blob = bucket.file(`${folder}/${file.originalname}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      blobStream
        .on("finish", async () => {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
          await blob.makePublic();

          resolve(publicUrl);
        })
        .on("error", reject)
        .end(file.buffer);
    });
  },
};

export { multerUpload, gcsHelper };
