const { initializeContext, okResponse } = require("../utils/utils");

module.exports.lambda_handler = async (event, context) => {
  initializeContext(event, context);

  return okResponse("resize-image", { event, context });
};
