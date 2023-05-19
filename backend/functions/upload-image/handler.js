const {
  initializeContext,
  okResponse,
  errResponse,
} = require("../../utils/utils");
const { v4: uuidv4, validate } = require("uuid");
const { QueryStringParameterException } = require("../../utils/exceptions");
const { generatePutPresignedUrl } = require("../../clients/s3");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);
  try {
    validateQueryString(event.queryStringParameters);

    const url = await generatePutPresignedUrl(
      process.env.INPUT_IMAGE_BUCKET_NAME,
      `input/${event.queryStringParameters.image_name}`
    );

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
