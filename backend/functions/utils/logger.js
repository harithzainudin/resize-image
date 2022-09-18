const winston = require("winston");
require("util").inspect.defaultOptions.depth = null;
const { setRequestId } = require("../utils/response");

let logger = winston;

/**
 * It initializes the logger and sets the requestId
 * @param [event=null] - The event object that triggered the lambda function.
 * @param [context=null] - This is the context object that is passed to the Lambda function. It
 * contains information about the Lambda function and the execution environment.
 * { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6}
 */
function initializeContext(event = null, context = null) {
  setRequestId(context?.awsRequestId || null);

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
    defaultMeta: {
      requestId: context?.awsRequestId || null,
      service: context?.functionName || null,
      timestamp:
        event?.requestContext?.requestTimeEpoch || new Date().getTime(),
    },
  });

  event?.requestContext
    ? logger.info("Request Context", {
        identity: event?.requestContext,
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
  error,
  warn,
  info,
  verbose,
  debug,
  initializeContext,
};
