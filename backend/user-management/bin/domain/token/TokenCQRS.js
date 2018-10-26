const Rx = require("rxjs");
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const TokenDA = require("../../data/TokenDA");
//  const RoleValidator = require("../../tools/RoleValidator");
const { CustomError, DefaultError } = require("../../tools/customError");
const {
  PERMISSION_DENIED_ERROR_CODE,
  INTERNAL_SERVER_ERROR_CODE
} = require("../../tools/ErrorCodes");

let instance;

class TokenCQRS {
  constructor() { }
  
  /**
   * Gets token to make operations that require authentication. 
   * If the refresh token is passed as a parameter, we'll try to refresh the access token; 
   * otherwise, we will generate a new access token with the user and password.
   *
   * @param args args
   * @param args.username username
   * @param args.password password
   * @param args.refreshToken Token to refresh the access token
   */
  getToken$({ args }, authToken) {
    return Rx.Observable.of(args)
      .mergeMap(({username, password, refreshToken}) => {
        return TokenDA.getToken$(username, password, refreshToken)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse1$(rawResponse))
      .catch(err => {
        console.log('err => ', err);
        return this.handleError$(err);
      });
  }

  //#region  mappers for API responses
  handleError$(err) {
    console.log('Handle error => ', err);
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {} };
      const isCustomError = err instanceof CustomError;
      if (!isCustomError) {
        err = new DefaultError(err);
      }
      exception.result = {
        code: err.code,
        error: { ...err.getContent() }
      };
      return exception;
    });
  }

  /**
   * 
   * @param {*} rawRespponse 
   * @returns {Observable}
   */
  buildSuccessResponse1$(rawRespponse) {
    return Rx.Observable.of(rawRespponse).map(resp => {
      return {
        data: resp,
        result: {
          code: 200
        }
      };
    });
  }

}

/**
 * Token event consumer
 * @returns {TokenCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new TokenCQRS();
    console.log("TokenCQRS Singleton created ");
  }
  return instance;
};
