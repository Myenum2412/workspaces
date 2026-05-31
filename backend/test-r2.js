import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

async function test() {
  try {
    const res = await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: "profile_images/test.txt",
      Body: "Hello from test!",
      ContentType: "text/plain",
    }));
    console.log("Success! ETag:", res.ETag);
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
