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
  USER_NAME_OR_EMAIL_EXISTS_ERROR_CODE,
  PERMISSION_DENIED_ERROR_CODE
} = require("../tools/ErrorCodes");

/**
 * Singleton instance
 */
let instance;

class User {
  constructor() {}

  /**
   * Gets the useres filtered by page, count, textFilter, order and column
   *
   * @param {*} args args that contain the user filters
   */
  getUsers$({ args }, authToken) {
    // const requestedFields = this.getProjection(fieldASTs);
    //console.log("AuthToken ==> ", authToken);
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "getUsers$()",
      PERMISSION_DENIED_ERROR_CODE,
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
   * Gets an user by its username
   *
   * @param {*} args args that contain the username of the user to query
   * @param {string} jwt JWT token
   * @param {string} fieldASTs indicates the user attributes that will be returned
   */
  getUser$({ args, jwt, fieldASTs }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "getUser$()",
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.getUser$(
          args.username,
          null,
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
      PERMISSION_DENIED_ERROR_CODE,
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
    console.log("33 Create user ==> ", data);
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

    user.username = user.username.trim();
    user.businessId = authToken.businessId;
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "createUser$()",
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return Rx.Observable.forkJoin(
          UserKeycloakDA.getUser$(user.username, null, null),
          UserKeycloakDA.getUser$(null, user.email, null)
        ).mergeMap(([userUsernameFound, userEmailFound]) => {
          //console.log('EXISTED =================== > ', val);
          console.log("22 User exists: ", userUsernameFound, userEmailFound);
          if (userUsernameFound || userEmailFound) {
            return Rx.Observable.throw(
              new CustomError(
                "UserManagement",
                "createUser$()",
                USER_NAME_OR_EMAIL_EXISTS_ERROR_CODE,
                "User name or email exists",
                ["business-admin"]
              )
            );
          }

          return eventSourcing.eventStore.emitEvent$(
            new Event({
              eventType: "UserCreated",
              eventTypeVersion: 1,
              aggregateType: "User",
              aggregateId: user.id,
              data: user.username,
              user: authToken.preferred_username
            })
          );
        });
      })
      .map(result => {
        return {
          code: 200,
          message: `User with id: ${user.username} has been created`
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
    console.log("11 Updating user ==> ", data);
    const userId = !data.args ? undefined : data.args.userId;
    const generalInfo = !data.args ? undefined : data.args.input;
    const user = {
      generalInfo: generalInfo,
      businessId: authToken.businessId,
      id: userId
    };
    
    if (
      !userId ||
      !generalInfo ||
      !generalInfo.username ||
      !generalInfo.name ||
      !generalInfo.lastname
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
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return eventSourcing.eventStore.emitEvent$(
          new Event({
            eventType: "UserGeneralInfoUpdated",
            eventTypeVersion: 1,
            aggregateType: "User",
            aggregateId: generalInfo.username,
            data: user,
            user: authToken.preferred_username
          })
        );
      })
      .map(result => {
        return {
          code: 200,
          message: `User general info with id: ${generalInfo.username} has been updated`
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
    const id = !data.args ? undefined : data.args.userId;
    const username = !data.args ? undefined : data.args.username;
    const newState = !data.args ? undefined : data.args.state;
    if (!id || username == null || newState == null) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "updateUserState$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    const user = {
      id: id,
      username: username,
      state: newState
    };
    console.log('User state == ', user);

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "updateUserState$()",
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return eventSourcing.eventStore.emitEvent$(
          new Event({
            eventType: newState ? "UserActivated" : "UserDeactivated",
            eventTypeVersion: 1,
            aggregateType: "User",
            aggregateId: username,
            data: user,
            user: authToken.preferred_username
          })
        );
      })
      .map(result => {
        return {
          code: 200,
          message: `User status with username: ${username} has been updated`
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
  resetUserPassword$(data, authToken) {
    const id = !data.args ? undefined : data.args.id;
    const userPassword = !data.args ? undefined : data.args.input;

    if (!id || !userPassword) {
      return Rx.Observable.throw(
        new CustomError(
          "UserManagement",
          "resetUserPassword$()",
          USER_MISSING_DATA_ERROR_CODE,
          "User missing data"
        )
      );
    }

    //Checks if the user that is performing this actions has the needed role to execute the operation.
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "resetUserPassword$()",
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    )
      .mergeMap(val => {
        return UserKeycloakDA.resetUserPassword$(id, userPassword);
      })
      .map(result => {
        return {
          code: 200,
          message: `Password of the user with id: ${id} has been changed`
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
      PERMISSION_DENIED_ERROR_CODE,
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
                  USER_NAME_OR_EMAIL_EXISTS_ERROR_CODE,
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

  //#region  mappers for API responses

  handleError$(err) {
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {} };
      const isCustomError = err instanceof CustomError;
      if (!isCustomError) {
        console.log("ERROR HANDLE ==> ", err);
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
