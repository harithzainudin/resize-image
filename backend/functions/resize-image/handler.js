const { getObject, uploadObject } = require("../../clients/s3");
const {
  initializeContext,
  okResponse,
  errResponse,
  error,
  debug,
} = require("../../utils/utils");
const sharp = require("sharp");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);

  try {
    const srcBucket = event.Records[0].s3.bucket.name;
    const srcKey = event.Records[0].s3.object.key;
    const response = await getObject(srcBucket, srcKey);
    if (response) {
      debug("Starting to resizing image...", { image: response });
      console.time("resizing image");
      const resizedImage = await sharp(response).resize(10).toBuffer();
      console.timeEnd("resizing image");
      debug("Finish to resizing image...Starting to upload object");
      await uploadObject(srcBucket, `resized/10_${srcKey}`, resizedImage);
      debug("Finish uploading object...");
    }

    return okResponse("Successfully process image");
  } catch (e) {
    error("Fail to process image", {
      name: e?.name,
      stack: e?.stack,
      message: e?.message,
    });
    return errResponse(500, "Fail to process image", e);
  }
};
