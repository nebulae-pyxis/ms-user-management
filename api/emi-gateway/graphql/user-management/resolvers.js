const withFilter = require("graphql-subscriptions").withFilter;
const RoleValidator  = require("../../tools/RoleValidator");
const { CustomError } = require("../../tools/customError");
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const Rx = require("rxjs");
const broker = require("../../broker/BrokerFactory")();
const contextName = "User-Management";

//Every single error code
// please use the prefix assigned to this microservice
const INTERNAL_SERVER_ERROR_CODE = 16001;
const USERS_PERMISSION_DENIED_ERROR_CODE = 16002;

/**
 * get response and return an error if the http code is different to 200 
 * @param {*} response 
 */
function getResponseFromBackEnd$(response) {
  return Rx.Observable.of(response).map(resp => {
    if (resp.result.code != 200) {
      const err = new Error();
      err.name = "Error";
      err.message = resp.result.error;
      Error.captureStackTrace(err, "Error");
      throw err;
    }
    return resp.data;
  });
}

/**
 * Handles errors
 * @param {*} err
 * @param {*} operationName
 */
function handleError$(err, methodName) {
  return Rx.Observable.of(err).map(err => {
    const exception = { data: null, result: {} };
    const isCustomError = err instanceof CustomError;
    if (!isCustomError) {
      err = new CustomError(
        err.name,
        methodName,
        INTERNAL_SERVER_ERROR_CODE,
        err.message
      );
    }
    exception.result = {
      code: err.code,
      error: { ...err.getContent() }
    };
    return exception;
  });
}

module.exports = {
  //// QUERY //////
  Query: {
    getUsers(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "getUsers",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.query.getUsers",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "getUsers"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    getUser(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "getUser",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.query.getUser",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "getUser"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    getUserRoleMapping(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "getUserRoleMapping",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.query.getUserRoleMapping",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "getUserRoleMapping"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    getRoles(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "getRoles",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.query.getRoles",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "getRoles"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
  },

  //// MUTATIONS ///////
  Mutation: {
    createUser(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "createUser",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return context.broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.mutation.createUser",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "createUser"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    updateUserGeneralInfo(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "updateUserGeneralInfo",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return context.broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.mutation.updateUserGeneralInfo",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, " updateUserGeneralInfo"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    updateUserState(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "updateUserState",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return context.broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.mutation.updateUserState",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, " updateUserState"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    resetUserPassword(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "resetUserPassword",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return context.broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.mutation.resetUserPassword",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, " resetUserPassword"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    addRolesToTheUser(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "addRolesToTheUser",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return context.broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.mutation.addRolesToTheUser",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "addRolesToTheUser"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
    removeRolesFromUser(root, args, context) {
      return RoleValidator.checkPermissions$(
        context.authToken.realm_access.roles,
        contextName,
        "removeRolesFromUser",
        USERS_PERMISSION_DENIED_ERROR_CODE,
        "Permission denied",
        ["business-owner"]
      )
        .mergeMap(response => {
          return context.broker.forwardAndGetReply$(
            "User",
            "emigateway.graphql.mutation.removeRolesFromUser",
            { root, args, jwt: context.encodedToken },
            2000
          );
        })
        .catch(err => handleError$(err, "removeRolesFromUser"))
        .mergeMap(response => getResponseFromBackEnd$(response))
        .toPromise();
    },
  },

  //// SUBSCRIPTIONS ///////
  Subscription: {
    UserUpdatedSubscription: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          //Checks the roles of the user, if the user does not have at least one of the required roles, an error will be thrown
          RoleValidator.checkAndThrowError(
            context.authToken.realm_access.roles,
            ["business-owner"],
            contextName,
            "UserUpdatedSubscription",
            USERS_PERMISSION_DENIED_ERROR_CODE,
            "Permission denied"
          );
          return pubsub.asyncIterator("UserUpdatedSubscription");
        },
        (payload, variables, context, info) => {
          return true;
        }
      )
    }
  }
};

//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
  {
    backendEventName: "UserUpdatedSubscription",
    gqlSubscriptionName: "UserUpdatedSubscription",
    dataExtractor: evt => evt.data, // OPTIONAL, only use if needed
    onError: (error, descriptor) =>
      console.log(`Error processing ${descriptor.backendEventName}`), // OPTIONAL, only use if needed
    onEvent: (evt, descriptor) =>
      console.log(`Event of type  ${descriptor.backendEventName} arraived`) // OPTIONAL, only use if needed
  }
];

/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
  broker.getMaterializedViewsUpdates$([descriptor.backendEventName]).subscribe(
    evt => {
      if (descriptor.onEvent) {
        descriptor.onEvent(evt, descriptor);
      }
      const payload = {};
      payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor
        ? descriptor.dataExtractor(evt)
        : evt.data;
      pubsub.publish(descriptor.gqlSubscriptionName, payload);
    },

    error => {
      if (descriptor.onError) {
        descriptor.onError(error, descriptor);
      }
      console.error(`Error listening ${descriptor.gqlSubscriptionName}`, error);
    },

    () => console.log(`${descriptor.gqlSubscriptionName} listener STOPED.`)
  );
});