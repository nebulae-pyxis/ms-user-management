const UserKeycloakDA = require("../data/UserKeycloakDA");
const Rx = require("rxjs");
const RoleValidator = require("../tools/RoleValidator");
const { CustomError, DefaultError } = require("../tools/customError");
const {
  USER_MISSING_DATA_ERROR_CODE,
  USER_NAME_ALREADY_USED_CODE,
  EMAIL_ALREADY_USED_ERROR_CODE,
  PERMISSION_DENIED_ERROR_CODE,
  INVALID_USERNAME_FORMAT_ERROR_CODE,
  USER_UPDATE_OWN_INFO_ERROR_CODE,
  USER_BELONG_TO_OTHER_BUSINESS_ERROR_CODE
} = require("../tools/ErrorCodes");
const context = "UserManagement";
const userNameRegex = /^(?=[a-zA-Z0-9.]{8,}$)(?=.*?[a-z])(?=.*?[0-9]).*/;

class UserValidatorHelper {
  //Validates if the user can be created checking if the info
  // is valid and the username and email have not been used
  static validateUserCreation$(data, authToken) {
    const method = "createUser$()";
    //Validate if the user that is performing the operation has the required role.
    return (
      this.checkRole$(authToken, method)
        .mergeMap(rol => {
          const user = !data.args ? undefined : data.args.input;
          //Validate if required parameters were sent
          const invalidUserMissingData =
            !user ||
            !user.username ||
            !user.name ||
            !user.lastname ||
            user.username.trim().length == 0;
          //Evaluate if the username has a valid format
          const invalidUserNameFormat =
            !user ||
            !user.username ||
            !user.username.trim().match(userNameRegex);

          if (invalidUserMissingData || invalidUserNameFormat) {
            return this.createCustomError$(
              invalidUserMissingData
                ? USER_MISSING_DATA_ERROR_CODE
                : INVALID_USERNAME_FORMAT_ERROR_CODE,
              method
            );
          }

          user.username = user.username.trim();
          user.businessId = authToken.businessId;

          return Rx.Observable.of(user);
        })
        //Checks if the username already was used
        .mergeMap(user => {
          return this.checkUserExists$(user, user.username, method);
        })
        //Checks if the email already was used
        .mergeMap(user => {
          return this.checkUserExists$(user, null, user.email, method);
        })
    );
  }

  //Validates if the user can be updated checking if the info
  // is valid and the username and email have not been used
  static validateUpdateUser$(data, authToken) {
    const method = "updateUserGeneralInfo$() -> ";
    //Validate if the user that is performing the operation has the required role.
    return (
      this.checkRole$(authToken, method)
        .mergeMap(rol => {
          const user = {
            generalInfo: !data.args ? undefined : data.args.input,
            id: !data.args ? undefined : data.args.userId,
            businessId: authToken.businessId
          };

          if (
            !user.id ||
            !user.generalInfo ||
            !user.generalInfo.name ||
            !user.generalInfo.lastname
          ) {
            return this.createCustomError$(
              USER_MISSING_DATA_ERROR_CODE,
              method
            );
          }

          return Rx.Observable.of(user);
        })
        //Checks if the user that is being updated exists on the same business of the user that is performing the operation
        .mergeMap(user => {
          return this.checkIfUserBelongsToTheSameBusiness$(user, authToken, method);
        })
        .mergeMap(user => this.checkIfUserIsTheSameUserLogged$(user, authToken, method))
        //Checks if the new email is already used by other user
        .mergeMap(user => {
          return UserKeycloakDA.getUser$(
            null,
            user.generalInfo.email,
            null
          ).mergeMap(userEmailFound => {
            if (userEmailFound && user.id != userEmailFound.id) {
              return this.createCustomError$(
                EMAIL_ALREADY_USED_ERROR_CODE,
                method
              );
            }
            return Rx.Observable.of(user);
          });
        })
    );
  }

  //Validates if the user can update its state
  static validateUpdateUserState$(data, authToken) {
    const method = "updateUserState$()";
    //Validate if the user that is performing the operation has the required role.
    return (
      this.checkRole$(authToken, method)

        .mergeMap(rol => {
          const user = {
            id: !data.args ? undefined : data.args.userId,
            state: !data.args ? undefined : data.args.state
          };

          if (!user.id || user.state == null) {
            return this.createCustomError$(
              USER_MISSING_DATA_ERROR_CODE,
              method
            );
          }

          return Rx.Observable.of(user);
        })
        //Checks if the user that is being updated exists on the same business of the user that is performing the operation
        .mergeMap(user => {
          return this.checkIfUserBelongsToTheSameBusiness$(user, authToken, method);
        })
    );
  }

  //Validates if the user can resset its password
  static validatePasswordReset$(data, authToken) {
    const method = "resetUserPassword$()";
    //Validate if the user that is performing the operation has the required role.
    return (
      this.checkRole$(authToken, method)
        .mergeMap(rol => {
          const userPassword = !data.args ? undefined : data.args.input;

          const user = {
            id: !data.args ? undefined : data.args.userId,
            password: {
              temporary: userPassword.temporary || false,
              value: userPassword.password
            }
          };

          if (!user.id || !userPassword || !userPassword.password) {
            return this.createCustomError$(
              USER_MISSING_DATA_ERROR_CODE,
              method
            );
          }

          return Rx.Observable.of(user);
        })
        .mergeMap(user => this.checkIfUserIsTheSameUserLogged$(user, authToken))
        //Checks if the user that is being updated exists on the same business of the user that is performing the operation
        .mergeMap(user => {
          return this.checkIfUserBelongsToTheSameBusiness$(user, authToken, method);
        })
    );
  }

  //Validates if info to update the roles of an user
  static validateUserRoles$(data, authToken) {
    const method = "addRolesToTheUser$() | removeRolesFromUser$()";
    //Validate if the user that is performing the operation has the required role.
    return (
      this.checkRole$(authToken, method)
        .mergeMap(rol => {
          const user = {
            id: !data.args ? undefined : data.args.userId,
            userRoles: !data.args ? undefined : data.args.input
          };
          if (!user.id || !user.userRoles) {
            return this.createCustomError$(
              USER_MISSING_DATA_ERROR_CODE,
              method
            );
          }

          return Rx.Observable.of(user);
        })
        .mergeMap(user => this.checkIfUserIsTheSameUserLogged$(user, authToken))
        //Checks if the user that is being updated exists on the same business of the user that is performing the operation
        .mergeMap(user => {
          return this.checkIfUserBelongsToTheSameBusiness$(user, authToken, method);
        })
    );
  }

  /**
   * Checks if the user that is performing the operation is the same user that is going to be updated.
   * @param {*} user 
   * @param {*} authToken 
   * @returns error if its trying to update its user
   */
  static checkIfUserIsTheSameUserLogged$(user, authToken, method){
    if (user.id == authToken.sub) {
      return this.createCustomError$(
        USER_UPDATE_OWN_INFO_ERROR_CODE,
        method
      );
    }
    return Rx.Observable.of(user);
  }

  /**
   * Checks if the user belongs to the same business of the user that is performing the operation
   * @param {*} userId User ID
   */
  static checkIfUserBelongsToTheSameBusiness$(user, authToken, method) {
    return UserKeycloakDA.getUserByUserId$(user.id).mergeMap(userFound => {
      if (userFound && userFound.businessId != authToken.businessId) {
        return this.createCustomError$(
          USER_BELONG_TO_OTHER_BUSINESS_ERROR_CODE,
          method
        );
      }
      return Rx.Observable.of(user);
    });
  }

  /**
   * Checks if the user that is performing the operation has the needed permissions to execute the operation
   * @param {*} authToken Token of the user
   * @param {*} context Name of the microservice
   * @param {*} method Method where the verification is being done
   */
  static checkRole$(authToken, method) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      context,
      method,
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["business-owner"]
    );
  }

  /**
   * Checks if the user exists according to the username or email
   * @param {*} user User data
   * @param {*} username Username to check
   * @param {*} email Email to check
   */
  static checkUserExists$(user, username, email, method) {
    return UserKeycloakDA.getUser$(username, email, null).mergeMap(
      userUsernameFound => {
        if (userUsernameFound) {
          return this.createCustomError$(USER_NAME_ALREADY_USED_CODE, method);
        }
        return Rx.Observable.of(user);
      }
    );
  }

  /**
   * Creates a custom error observable
   * @param {*} errorCode Error code
   * @param {*} methodError Method where the error was generated
   */
  static createCustomError$(errorCode, methodError) {
    return Rx.Observable.throw(
      new CustomError(
        context,
        methodError || "",
        errorCode.code,
        errorCode.description
      )
    );
  }
}

module.exports = UserValidatorHelper;
