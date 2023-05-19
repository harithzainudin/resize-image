const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new S3Client({ region: process.env.AWS_REGION });

async function generatePutPresignedUrl(bucketName, key) {
  const command = new PutObjectCommand({ Bucket: bucketName, Key: key });
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

async function generateGetPresignedUrl(bucketName, key) {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

module.exports = { generatePutPresignedUrl, generateGetPresignedUrl };
