class QueryStringParameterException extends Error {
  constructor(message) {
    super(message);
    this.name = "QueryStringParameterException";
  }
}

class InternalServerError extends Error {
  constructor(message) {
    super(message);
    this.name = "InternalServerError";
  }
}

module.exports = {
  QueryStringParameterException,
  InternalServerError,
};
