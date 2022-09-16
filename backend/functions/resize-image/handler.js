const { info, initializeContext } = require("../utils/logger");
const { okResponse } = require("../utils/response");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);

  return okResponse("resize-image", { event, context });
};
