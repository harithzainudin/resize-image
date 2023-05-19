const {
  initializeContext,
  okResponse,
  errResponse,
  debug,
} = require("../../utils/utils");
const { generateGetPresignedUrl } = require("../../clients/s3");
const {
  InternalServerError,
  QueryStringParameterException,
} = require("../../utils/exceptions");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);

  try {
    validateQueryString(event.queryStringParameters);

    const url = await generateGetPresignedUrl(
      process.env.IMAGE_BUCKET_NAME,
      `input/${event.queryStringParameters.image_name}`
    );

    debug("Get presigned URL response", { response: url });

    return okResponse("Successfully generate get presigned URL", {
      get_presigned_url: url,
      file_name: event.queryStringParameters.image_name,
    });
  } catch (e) {
    return errResponse(
      500,
      "Fail to generate get presigned url for the requested object",
      new InternalServerError("Fail to generate get presigned URL")
    );
  }
};

function validateQueryString(qsp) {
  if (!qsp?.image_name) {
    throw new QueryStringParameterException(
      "image_name is required to get the image"
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
