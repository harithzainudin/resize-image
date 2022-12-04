class QueryStringParameterException extends Error {
  constructor(message) {
    super(message);
    this.name = "QueryStringParameterException";
  }
}

module.exports = {
  QueryStringParameterException,
};
