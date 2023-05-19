const {
  initializeContext,
  okResponse,
  errResponse,
} = require("../../utils/utils");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4, validate } = require("uuid");
const { QueryStringParameterException } = require("../../utils/exceptions");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);
  try {
    const client = new S3Client();

    validateQueryString(event.queryStringParameters);

    const command = new PutObjectCommand({
      Bucket: process.env.INPUT_IMAGE_BUCKET_NAME,
      Key: `input/${event.queryStringParameters.image_name}`,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return okResponse("get-image", {
      get_presigned_url: url,
      file_name: event.queryStringParameters.image_name,
    });
  } catch (e) {
    return errResponse(
      e instanceof QueryStringParameterException ? 400 : 500,
      "Fail to generate signed url for upload image",
      e
    );
  }
};

function validateQueryString(qsp) {
  if (!qsp?.image_name) {
    throw new QueryStringParameterException("image_name is required");
  }

  if (!validate(qsp.image_name.split(".")[0])) {
    throw new QueryStringParameterException(
      "image_name must be in UUID format for unique name. Example: 4c9a2b8f-a7e8-4e9d-b8b4-f6a9c9d9b6b.jpeg"
    );
  }

  const VALID_FILE_EXTENSION = ["jpeg", "jpg", "png"];

  if (
    !Object.values(VALID_FILE_EXTENSION).includes(
      qsp.image_name.split(".").pop()
    )
  ) {
    throw new QueryStringParameterException(
      `Image name does not have a valid file extension. Must have extension with ${VALID_FILE_EXTENSION}`
    );
  }
}
