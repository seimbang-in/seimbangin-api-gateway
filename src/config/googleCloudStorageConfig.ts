import { Storage } from "@google-cloud/storage";

const googleCredential = process.env.GOOGLE_CLOUD_CREDENTIALS || "";

const storage = new Storage({
  credentials: JSON.parse(googleCredential),
});

const bucketName = process.env.BUCKET_NAME || "";

const bucket = storage.bucket(bucketName);

export { bucket };
