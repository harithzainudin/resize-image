/**
 * OVERVIEW
 * This util file contain the response & logger for BFF
 * The reason we are combining both of this util into 1 file is because
 *  1. We want to have a consistent requestId for both response & logger
 *     and pass back to FE for debugging purpose
 *  2. It will causes circular dependecy when logger & response are separeted into different files
 *     as we are trying to set a global requestId in the logger/response
 *  3. We want to log the response that we pass to FE for the okResponse/errResponse
 */

const winston = require("winston");

let logger = winston;
let requestId = null;

/**
 * It returns a JSON object with a status code of 200, and the message and data you pass to it
 * @param message - The message you want to send back to the client.
 * @param [data] - The data you want to return to the client.
 * @returns A function that returns an object.
 */
function okResponse(message, data = {}) {
  info(message, data);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      requestId: requestId,
      status_code: 200,
      message: message,
      data: data,
    }),
  };
}

/**
 * OVERVIEW
 * It takes a message and an error object, constructs an error object, and returns a response object
 * with the error object and message
 *
 * STATUS CODE
 * Some of the Status code will be set automatically as we only have 400, 404 or 500 status code
 * If the status code is not set, it will be set to 500 as default
 * If the status code is set, it will be pass as it is
 * Check here for supported status code from serverless
 * https://www.serverless.com/framework/docs/providers/aws/events/apigateway#status-codes
 *
 * ERROR OBJECT VALUE
 * 1. To pass in PayloadNotValidException, if it comes from AJV errors, please stringify the value from AJV inside the
 *    message during throw new PayloadNotValidException.
 *    It will be parsed back to JSON object in the constructError function
 *    e.g. throw new PayloadNotValidException(JSON.stringify(errors))
 * 2. If there is no error object provided, it will return a generic default error message[see the function constructError]
 *
 *
 * @param message - The message you want to send back to the client.
 * @param [errorObject] - The error object that is thrown by BFF or during try catch.
 * @returns An object with the following properties:
 *   - statusCode: The status code of the error
 *   - headers: The headers of the response
 *   - body: @returns An object with the following properties:
 *      - requestId: Request ID of the lambda for debugging purposes
 *      - status_code: The status code of the error
 *      - message: The message you want to send back to the client.
 *      - error: Custom error that has been constructed according to the error object & message that is being passed in
 */
function errResponse(statusCode = 500, message, errorObject = {}) {
  const constructedError = constructError(errorObject, message, statusCode);

  return {
    statusCode: constructedError.statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      requestId: requestId,
      status_code: constructedError.statusCode,
      message: message,
      error: constructedError.error,
    }),
  };
}

/**
 * Construct the message and error detail to be pass into FE
 * It takes in an error object and a message, and returns a formatted error object
 * There's a lot of conditional checking to make sure that the error object is in the correct format
 * and to make sure that we are not passing in stack trace which contain sensitive information to FE
 * @param e - The error object that is thrown by BFF or by the system during try catch.
 * @param message - The message to be logged.
 * @returns an object with statusCode, error.name, error.message, error.error
 */
function constructError(e, message, statusCode) {
  let detailErrorForLogger = {
    isBffError: false,
    isAxiosError: false,
    detail: {
      name: "Error",
      message: message,
      error:
        "No stack trace available. Provide the Error object to get the detail of the error",
    },
  };

  let returnError = {
    statusCode: statusCode,
    error: {
      name: "BffServerError",
      message: "Bff server error occurred. Please contact administrator",
      error: null,
    },
  };

  // Doing early return if there is no error object being passed in
  if (!e) {
    error("Detail error", detailErrorForLogger);
    return {
      statusCode: statusCode,
      error: {
        name: null,
        message: null,
        error: null,
      },
    };
  }

  // BE is throwing error
  if (e?.isAxiosError) {
    // to check if the status coming from BE is 404
    if (e.response.status === 404) {
      detailErrorForLogger = {
        isBffError: false,
        isAxiosError: true,
        detail: {
          error: e.response.data,
          url: e.config.url,
          method: e.config.method,
        },
      };
      returnError = {
        statusCode: e.response.status,
        error: {
          name: "NotFound",
          message: "The requested resource was not found.",
          error: null,
        },
      };
      // other than 404, will return as BE error
    } else {
      detailErrorForLogger = {
        isBffError: false,
        isAxiosError: true,
        detail: {
          error: e.response.data,
          url: e.config.url,
          method: e.config.method,
        },
      };
      returnError = {
        statusCode: 500,
        error: {
          name: "BackendServerError",
          message:
            "Backend server error occurred. Please contact administrator",
          error: null,
        },
      };
    }
  } else {
    // using duck typing to check for custom error exception generated by BFF
    // which is not coming from Axios error
    if (e?.name && e?.message && e?.stack) {
      detailErrorForLogger = {
        isBffError: false,
        isAxiosError: false,
        detail: { name: e.name, message: e.message, error: e.stack },
      };
      // If have any other custom error, please add here
      if (e.name === "PayloadNotValidException") {
        let msg;

        // Some of the error message that is part of PayloadNotValidException is stringified AJV errors JSON object
        try {
          msg = JSON.parse(e.message);
        } catch {
          msg = e.message;
        }

        detailErrorForLogger = {
          ...detailErrorForLogger,
          detail: {
            name: e.name,
            message: "Payload is not valid",
            error: msg,
          },
        };
        returnError = {
          statusCode: 400,
          error: detailErrorForLogger.detail,
        };
      } else {
        // to check if the status code is 500, meaning, status code using the default value
        // and we dont want to return the stack trace to FE, instead, we return a generic error message
        if (statusCode === 500) {
          returnError = {
            statusCode: 500,
            error: {
              name: "BffServerError",
              message:
                "Bff server error occurred. Please contact administrator",
              error: null,
            },
          };
          // expected that status code is being set and custom error is being defined,
          // so, we will pass the error object as it is with the custom stack that has been defined
        } else {
          returnError = {
            statusCode: statusCode,
            error: {
              name: e.name,
              message: e.message,
              error: null,
            },
          };
        }
      }
      // the error object is not conform to what we expect, so we will return as what have been passed in
      // additionally, this is not a good practice,
      // as we dont want to pass in stack trace to FE(if stack trace is being passed in)
    } else {
      detailErrorForLogger = {
        isBffError: false,
        isAxiosError: false,
        detail: e,
      };

      returnError = {
        statusCode: statusCode,
        error: e,
      };
    }
  }

  error("Detail error", detailErrorForLogger);
  return returnError;
}

/* A custom formatter for winston logger. */
const customFormatter = winston.format.printf((object) => {
  return `[${object.level.toUpperCase()}] - ${object.message}: ${JSON.stringify(
    object
  )}`;
});

/**
 * It initializes the logger and sets the requestId
 * @param [event=null] - The event object that triggered the lambda function.
 * @param [context=null] - This is the context object that is passed to the Lambda function. It
 * contains information about the Lambda function and the execution environment.
 * { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6}
 */
function initializeContext(event = null, context = null) {
  requestId = context?.awsRequestId || null;

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(winston.format.splat(), customFormatter),
    transports: [new winston.transports.Console()],
    defaultMeta: {
      requestId: context?.awsRequestId || null,
      service: context?.functionName || null,
      timestamp:
        event?.requestContext?.requestTimeEpoch || new Date().getTime(),
    },
  });

  event?.requestContext
    ? info("Request Context", {
        identity: event.requestContext,
        payload: {
          queryStringParameters: event?.queryStringParameters || null,
          pathParameters: event?.pathParameters || null,
          body: event?.body || null,
        },
      })
    : "";
}

/**
 * Log an error message and an object containing error details.
 * @param message - The message to log.
 * @param [errorObject] - An object containing the error message and stack trace.
 */
function error(message, errorObject = {}) {
  logger.error(message, { errors: errorObject });
}

/**
 * Log a warning message with an optional object containing additional information.
 * @param message - The message to be logged.
 * @param [warningObject] - An object that contains the parameters that you want to log.
 */
function warn(message, warningObject = {}) {
  logger.warn(message, { params: warningObject });
}

/**
 * It logs a message with an optional object.
 * @param message - The message to log.
 * @param [infoObject] - This is an object that contains the parameters that you want to log.
 */
function info(message, infoObject = {}) {
  logger.info(message, { params: infoObject });
}

/**
 * > The `verbose` function is a wrapper for the `logger.verbose` function that allows us to pass in an
 * object of parameters to be logged
 * @param message - The message to log.
 * @param [verboseObject] - This is an object that will be logged to the console.
 */
function verbose(message, verboseObject = {}) {
  logger.verbose(message, { params: verboseObject });
}

/**
 * "Log a message at the debug level, and include the given object as a parameter."
 *
 * The first parameter is the message to log. The second parameter is an object that will be included
 * in the log message as a parameter
 * @param message - The message to log.
 * @param [debugObject] - This is an object that will be logged to the console.
 */
function debug(message, debugObject = {}) {
  logger.debug(message, { params: debugObject });
}

module.exports = {
  okResponse,
  errResponse,
  error,
  warn,
  info,
  verbose,
  debug,
  initializeContext,
};
