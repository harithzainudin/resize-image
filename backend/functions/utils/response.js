let requestId = null;

/**
 * This function sets the requestId variable to the value of the requestId parameter.
 * @param requestId - The request ID that you want to set.
 */
function setRequestId(requestId) {
  requestId = requestId;
}

/**
 * It returns a JSON object with a status code of 200, and the message and data you pass to it
 * @param message - The message you want to send back to the client.
 * @param [data] - The data you want to return to the client.
 * @returns A function that returns an object.
 */
function okResponse(message, data = {}) {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      requestId: requestId,
      statusCode: 200,
      message: message,
      data: data,
    }),
  };
}

/**
 * It returns a JSON object with a statusCode that you set, headers, and a body
 * @param statusCode - The HTTP status code to return.
 * @param message - The error message to be returned to the client.
 * @param [errorObject] - This is an optional parameter that you can pass in to the function. It's an
 * object that will be returned in the response body.
 * @returns A function that returns an object.
 */
function errResponse(statusCode, message, errorObject = {}) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      requestId: requestId,
      statusCode: statusCode,
      message: message,
      error: errorObject,
    }),
  };
}

module.exports = {
  okResponse,
  errResponse,
  setRequestId,
};
