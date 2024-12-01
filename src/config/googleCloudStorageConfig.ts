import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

const googleCredentialPath = process.env.GOOGLE_CLOUD_CREDENTIALS || "";
let googleCredential = {};

if (googleCredentialPath) {
  const filePath = path.resolve(googleCredentialPath);
  googleCredential = JSON.parse(fs.readFileSync(filePath, "utf8"));
} else {
  googleCredential = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || "{}");
}

const storage = new Storage({
  credentials: googleCredential,
});

const bucketName = process.env.BUCKET_NAME || "";
const bucket = storage.bucket(bucketName);

export { bucket };
