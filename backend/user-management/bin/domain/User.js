"use strict";

const Rx = require("rxjs");
const UserKeycloakDA = require("../data/UserKeycloakDA");
const broker = require("../tools/broker/BrokerFactory")();
const eventSourcing = require("../tools/EventSourcing")();
const RoleValidator = require("../tools/RoleValidator");
const Event = require("@nebulae/event-store").Event;
const uuidv4 = require("uuid/v4");
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const { CustomError, DefaultError } = require("../tools/customError");
const {
  USER_MISSING_DATA_ERROR_CODE,
  USER_NAME_EXISTS_ERROR_CODE,
  USER_PERMISSION_DENIED_ERROR_CODE
} = require("../tools/ErrorCodes");

/**
 * Singleton instance
 */
let instance;

class User {
  constructor() {}

  /**
   * Gets the user according to the ID passed by args.
   *
   * @param {*} args args that contain the user ID
   * @param {string} jwt JWT token
   * @param {string} fieldASTs indicates the user attributes that will be returned
   */
  getUser$({ args, jwt, fieldASTs }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "changeUserState$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.getUser$(args.id);
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

  /**
   * Gets the useres filtered by page, count, textFilter, order and column
   *
   * @param {*} args args that contain the user filters
   */
  getUsers$({ args }, authToken) {
    // const requestedFields = this.getProjection(fieldASTs);
    console.log("AuthToken ==> ", authToken);
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "getUsers$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.getUsers$(
          args.page,
          args.count,
          args.filter,
          authToken.businessId
        );
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

  /**
   * Get the amount of rows from the user collection
   */
  getUserCount$(data, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "changeUserState$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.getUserCount$();
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  /**
   * Creates a new user
   *
   * @param {*} data args that contain the user ID
   * @param {string} authToken JWT token
   */
  createUser$(data, authToken) {
    const user = !data.args ? undefined : data.args.input;
    if (!user) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "createUser$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    user.generalInfo.name = user.generalInfo.name.trim();
    user._id = uuidv4();
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "createUser$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied"
    )
      .mergeMap(val => {
        return UserKeycloakDA.findUserName$(
          null,
          user.generalInfo.name
        ).mergeMap(count => {
          if (count > 0) {
            return Rx.Observable.throw(
              new CustomError(
                "UserManagement",
                "createUser$()",
                USER_NAME_EXISTS_ERROR_CODE,
                "User name exists",
                ["business-admin"]
              )
            );
          }

          return eventSourcing.eventStore.emitEvent$(
            new Event({
              eventType: "UserCreated",
              eventTypeVersion: 1,
              aggregateType: "User",
              aggregateId: user._id,
              data: user,
              user: authToken.preferred_username
            })
          );
        });
      })
      .map(result => {
        return {
          code: 200,
          message: `User with id: ${user._id} has been created`
        };
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  /**
   * Updates the user general info
   *
   * @param {*} data args that contain the user ID
   * @param {string} jwt JWT token
   */
  updateUserGeneralInfo$(data, authToken) {
    const id = !data.args ? undefined : data.args.id;
    const generalInfo = !data.args ? undefined : data.args.input;

    if (
      !id ||
      !generalInfo ||
      !generalInfo.userId ||
      !generalInfo.name ||
      !generalInfo.type
    ) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "updateUserGeneralInfo$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    //Checks if the user that is performing this actions has the needed role to execute the operation.
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "updateUserGeneralInfo$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.findUserName$(id, generalInfo.name).mergeMap(
          count => {
            if (count > 0) {
              return Rx.Observable.throw(
                new CustomError(
                  "UserManagement",
                  "updateUserGeneralInfo$()",
                  USER_NAME_EXISTS_ERROR_CODE,
                  "User name exists"
                )
              );
            }

            return eventSourcing.eventStore.emitEvent$(
              new Event({
                eventType: "UserGeneralInfoUpdated",
                eventTypeVersion: 1,
                aggregateType: "User",
                aggregateId: id,
                data: generalInfo,
                user: authToken.preferred_username
              })
            );
          }
        );
      })
      .map(result => {
        return {
          code: 200,
          message: `User general info with id: ${id} has been updated`
        };
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  /**
   * Updates the user general info
   *
   * @param {*} data args that contain the user ID
   * @param {string} jwt JWT token
   */
  changeUserPassword$(data, authToken) {
    const id = !data.args ? undefined : data.args.id;
    const generalInfo = !data.args ? undefined : data.args.input;

    if (
      !id ||
      !generalInfo ||
      !generalInfo.userId ||
      !generalInfo.name ||
      !generalInfo.type
    ) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "updateUserGeneralInfo$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    //Checks if the user that is performing this actions has the needed role to execute the operation.
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "updateUserGeneralInfo$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.findUserName$(id, generalInfo.name).mergeMap(
          count => {
            if (count > 0) {
              return Rx.Observable.throw(
                new CustomError(
                  "UserManagement",
                  "createUser$()",
                  USER_NAME_EXISTS_ERROR_CODE,
                  "User name exists"
                )
              );
            }

            return eventSourcing.eventStore.emitEvent$(
              new Event({
                eventType: "UserGeneralInfoUpdated",
                eventTypeVersion: 1,
                aggregateType: "User",
                aggregateId: id,
                data: generalInfo,
                user: authToken.preferred_username
              })
            );
          }
        );
      })
      .map(result => {
        return {
          code: 200,
          message: `User general info with id: ${id} has been updated`
        };
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  /**
   * Updates the user general info
   *
   * @param {*} data args that contain the user ID
   * @param {string} jwt JWT token
   */
  changeUserRole$(data, authToken) {
    const id = !data.args ? undefined : data.args.id;
    const generalInfo = !data.args ? undefined : data.args.input;

    if (
      !id ||
      !generalInfo ||
      !generalInfo.userId ||
      !generalInfo.name ||
      !generalInfo.type
    ) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "updateUserGeneralInfo$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    //Checks if the user that is performing this actions has the needed role to execute the operation.
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "updateUserGeneralInfo$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.findUserName$(id, generalInfo.name).mergeMap(
          count => {
            if (count > 0) {
              return Rx.Observable.throw(
                new CustomError(
                  "UserManagement",
                  "createUser$()",
                  USER_NAME_EXISTS_ERROR_CODE,
                  "User name exists"
                )
              );
            }

            return eventSourcing.eventStore.emitEvent$(
              new Event({
                eventType: "UserGeneralInfoUpdated",
                eventTypeVersion: 1,
                aggregateType: "User",
                aggregateId: id,
                data: generalInfo,
                user: authToken.preferred_username
              })
            );
          }
        );
      })
      .map(result => {
        return {
          code: 200,
          message: `User general info with id: ${id} has been updated`
        };
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  /**
   * Updates the user state
   *
   * @param {*} data args that contain the user ID and the new state
   * @param {string} authToken JWT token
   */
  updateUserState$(data, authToken) {
    const id = !data.args ? undefined : data.args.id;
    const newState = !data.args ? undefined : data.args.state;
    if (!id || newState == null) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "changeUserState$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "changeUserState$()",
      USER_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return eventSourcing.eventStore.emitEvent$(
          new Event({
            eventType: newState ? "UserActivated" : "UserDeactivated",
            eventTypeVersion: 1,
            aggregateType: "User",
            aggregateId: id,
            data: newState,
            user: authToken.preferred_username
          })
        );
      })
      .map(result => {
        return {
          code: 200,
          message: `User status with id: ${id} has been updated`
        };
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  //#region  mappers for API responses

  handleError$(err) {
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

  buildSuccessResponse$(rawRespponse) {
    return Rx.Observable.of(rawRespponse).map(resp => {
      return {
        data: resp,
        result: {
          code: 200
        }
      };
    });
  }

  //#endregion
}

module.exports = () => {
  if (!instance) {
    instance = new User();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
