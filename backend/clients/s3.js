const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
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

async function getObject(bucketName, key) {
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucketName, Key: key })
  );

  if (res.Body) {
    return await res.Body.transformToByteArray();
  } else {
    return undefined;
  }
}

async function uploadObject(bucketName, key, body) {
  await client.send(
    new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body })
  );
}

async function deleteObject(bucketName, key, body) {
  await client.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: key })
  );
}

module.exports = {
  generatePutPresignedUrl,
  generateGetPresignedUrl,
  getObject,
  uploadObject,
  deleteObject,
};
