const UserKeycloakDA = require("../data/UserKeycloakDA");
const Rx = require("rxjs");
const {
    USER_MISSING_DATA_ERROR_CODE,
    USER_NAME_OR_EMAIL_EXISTS_ERROR_CODE,
    PERMISSION_DENIED_ERROR_CODE,
    INVALID_USER_NAME_ERROR_CODE
  } = require("../tools/ErrorCodes");

class UserValidatorHelper {

  static validateUserCreation$(data) {
    //Validate if the user that is performing the operation has the required role.
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "UserManagement",
      "createUser$()",
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-admin"]
    ).mergeMap(rol => {
      const user = !data.args ? undefined : data.args.input;
      //Validate if required parameters were sent
      if (!user || !user.username || !user.name || !user.lastname) {
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

      if (!user.username) {
        return Rx.Observable.throw(
          new CustomError(
            "UserManagement",
            "createUser$()",
            INVALID_USER_NAME_ERROR_CODE,
            "User missing data"
          )
        );
      }

      return Rx.Observable.of(user);
    })
    .mergeMap(user => {
        return Rx.Observable.forkJoin(
            UserKeycloakDA.getUser$(user.username, null, null),
            UserKeycloakDA.getUser$(null, user.email, null)
          ).mergeMap(([userUsernameFound, userEmailFound]) => {
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
            return Rx.Observable.of(user);
          });
    });
  }
}

module.exports = UserValidatorHelper;
