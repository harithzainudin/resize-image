require("util").inspect.defaultOptions.depth = null;

module.exports.lambda_handler = async (event, context) => {
  console.log(event);
};
