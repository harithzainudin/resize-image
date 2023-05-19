# resize-image

Serverless project to resize any image using Lambda and S3 Bucket.

There are many ways to upload and get an object from s3 bucket, and in this project, we are using presigned URLs to upload and get the object from s3 bucket.

## Function in this serverless project

1. resize-image: It's an event driven S3 bucket that will trigger and invoke the Lambda whenever there is a new image uploaded to the bucket (input prefix). The Lambda will resize the image and save it to the same bucket that have different prefix (output).
2. get-image: A lambda function that will return the resized image from the S3 bucket as presigned url.
3. upload-image: A lambda function that will generate the PUT presigned url to upload the image to the S3 bucket.

TODO:

1. add logic for
   - get-image
   - resize-image
   - upload-image
