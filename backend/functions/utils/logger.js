const winston = require("winston");
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
  setRequestId(context.awsRequestId);

  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
    defaultMeta: {
      service: context?.functionName || null,
      requestId: context?.awsRequestId || null,
    },
  });

  event?.requestContext
    ? info("Request Context Information", event.requestContext)
    : "";
}

/**
 * "Log an error with a subject and an error object."
 *
 * The subject is a string that describes the error. The error object is an object that contains
 * information about the error
 * @param subject - The subject or the meessage of the log.
 * @param [errorObject] - An object that contains the error details.
 */
function error(subject, errorObject = {}) {
  logger.error({
    subject: subject,
    detail: errorObject,
  });
}

/**
 * "Log an error with the given subject and detail object."
 *
 * The first line of the function is a comment. It's a good idea to include a comment at the top of
 * each function that describes what the function does
 * @param subject - The subject or the message of the log.
 * @param [warnObject] - An object that contains the details of the warning.
 */
function warn(subject, warnObject = {}) {
  logger.warn({
    subject: subject,
    detail: warnObject,
  });
}

/**
 * It logs an info message with the given subject and infoObject
 * @param subject - The subject or the message of the log.
 * @param [infoObject] - This is an object that contains the details of the event.
 */
function info(subject, infoObject = {}) {
  logger.info({
    subject: subject,
    detail: infoObject,
  });
}

/**
 * `verbose` is a function that takes a subject and a verboseObject and logs them to the console
 * @param subject - The subject of the log.
 * @param [verboseObject] - This is an object that will be logged to the console.
 */
function verbose(subject, verboseObject = {}) {
  logger.verbose({
    subject: subject,
    detail: verboseObject,
  });
}

/**
 * It logs a debug message to the console.
 * @param subject - The subject of the log.
 * @param [debugObject] - This is an object that will be logged as a JSON string.
 */
function debug(subject, debugObject = {}) {
  logger.debug({
    subject: subject,
    detail: debugObject,
  });
}

module.exports = {
  error,
  warn,
  info,
  verbose,
  debug,
  initializeContext,
};
