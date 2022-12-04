const {
  initializeContext,
  okResponse,
  errResponse,
} = require("../utils/utils");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const { QueryStringParameterException } = require("../utils/exceptions");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);
  try {
    const client = new S3Client();

    validateQueryString(event.queryStringParameters);

    const imageName = event.queryStringParameters?.image_name || uuidv4();
    const imageExt = event.queryStringParameters.image_ext;

    const command = new PutObjectCommand({
      Bucket: process.env.INPUT_IMAGE_BUCKET_NAME,
      Key: `input/${imageName}.${imageExt}`,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return okResponse("get-image", { url: url, file_name: imageName });
  } catch (e) {
    return errResponse(
      e instanceof QueryStringParameterException ? 400 : 500,
      "get-image",
      e
    );
  }
};

function validateQueryString(qsp) {
  if (!qsp?.image_ext) {
    throw new QueryStringParameterException("image_ext is required");
  }
}
