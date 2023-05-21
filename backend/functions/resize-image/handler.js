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

    const decodedKey = decodeKey(srcKey);
    const response = await getObject(srcBucket, decodedKey);

    if (response) {
      debug("Starting to resize image...");
      const resizedImages = await resizeImage(response);
      const constructedPayload = constructUploadPayload(
        resizedImages,
        decodedKey
      );

      debug("Finish resizing image...Starting to upload object");
      await uploadImages(srcBucket, constructedPayload);
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

function constructUploadPayload(resizedImages, key) {
  const fileName = key.substring(key.lastIndexOf("/") + 1);
  const extension = fileName.substring(fileName.lastIndexOf("."));

  return [
    {
      key: `resized/${fileName.replace(extension, "")}/50${extension}`,
      content: resizedImages[0],
    },
    {
      key: `resized/${fileName.replace(extension, "")}/100${extension}`,
      content: resizedImages[1],
    },
    {
      key: `resized/${fileName.replace(extension, "")}/500${extension}`,
      content: resizedImages[2],
    },
  ];
}

// To have additional extra precautions in any case the s3 key is encoded
// Although during uploading, the user should upload the file name as UUID format
function decodeKey(key) {
  return decodeURIComponent(key).replace(/\+/g, " ");
}

async function resizeImage(image) {
  return await Promise.all([
    sharp(image).resize(50).toBuffer(),
    sharp(image).resize(100).toBuffer(),
    sharp(image).resize(500).toBuffer(),
  ]);
}

async function uploadImages(srcBucket, payload) {
  await Promise.all(
    payload.map((item) => uploadObject(srcBucket, item.key, item.content))
  );
}
