const withFilter = require("graphql-subscriptions").withFilter;
const RoleValidator  = require("../../tools/RoleValidator");
const { CustomError } = require("../../tools/customError");
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const Rx = require("rxjs");
const broker = require("../../broker/BrokerFactory")();

const {handleError$} = require('../../tools/GraphqlResponseTools');
const { of } = require('rxjs');
const { map, mergeMap, catchError } = require('rxjs/operators');
const contextName = "User-Management";

//Every single error code
// please use the prefix assigned to this microservice
const INTERNAL_SERVER_ERROR_CODE = 16001;
const USERS_PERMISSION_DENIED_ERROR_CODE = 16002;

function getResponseFromBackEnd$(response) {
  return of(response)
  .pipe(
      map(resp => {
          if (resp.result.code != 200) {
              const err = new Error();
              err.name = 'Error';
              err.message = resp.result.error;
              Error.captureStackTrace(err, 'Error');
              throw err;
          }
          return resp.data;
      })
  );
}

module.exports = {
  //// QUERY ///////
  Query: {
    getToken(root, args, context){
      return of({})
      .pipe(
        mergeMap(response => {
          return broker.forwardAndGetReply$(
            "Token",
            "salesgateway.graphql.query.getToken",
            { root, args, jwt: context.encodedToken },
            2000
          );
        }),
        catchError(err => handleError$(err, "getToken")),
        mergeMap(response => getResponseFromBackEnd$(response))
      ).toPromise();
    }
    
  },

  //// MUTATIONS ///////
  Mutation: {
  },

  //// SUBSCRIPTIONS ///////
  Subscription: {
  }
};

//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
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

    () => console.log(`${descriptor.gqlSubscriptionName} listener STOPPED`)
  );
});
