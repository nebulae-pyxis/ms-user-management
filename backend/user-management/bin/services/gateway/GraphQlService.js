"use strict";

const user = require("../../domain/User")();
const broker = require("../../tools/broker/BrokerFactory")();
const Rx = require("rxjs");
const jsonwebtoken = require("jsonwebtoken");
const jwtPublicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

let instance;

class GraphQlService {
  constructor() {
    this.functionMap = this.generateFunctionMap();
    this.subscriptions = [];
  }

  /**
   * Starts GraphQL actions listener
   */
  start$() {
    return Rx.Observable.from(this.getSubscriptionDescriptors()).map(params =>
      this.subscribeEventHandler(params)
    );
  }

  /**
   * build a Broker listener to handle GraphQL requests procesor
   * @param {*} descriptor
   */
  subscribeEventHandler({
    aggregateType,
    messageType,
    onErrorHandler,
    onCompleteHandler
  }) {
    const handler = this.functionMap[messageType];
    const subscription = broker
      .getMessageListener$([aggregateType], [messageType])
      //decode and verify the jwt token
      .map(message => {
        return {
          authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey),
          message
        };
      }).catch(err => {
        return Rx.Observable.of(
          {
            response,
            correlationId: message.id,
            replyTo: message.attributes.replyTo 
          }
        )
        .mergeMap(msg => this.sendResponseBack$(msg))

      })
      //ROUTE MESSAGE TO RESOLVER
      .mergeMap(({ authToken, message }) =>
        handler.fn.call(handler.obj, message.data, authToken).map(response => {
          return {
            response,
            correlationId: message.id,
            replyTo: message.attributes.replyTo
          };
        })
      )
      .mergeMap(msg => this.sendResponseBack$(msg))
      .catch(error => {
        return Rx.Observable.of(null)
      })
      .subscribe(
        msg => {
          // console.log(`GraphQlService: ${messageType} process: ${msg}`);
        },
        onErrorHandler,
        onCompleteHandler
      );
    this.subscriptions.push({
      aggregateType,
      messageType,
      handlerName: handler.fn.name,
      subscription
    });
    return {
      aggregateType,
      messageType,
      handlerName: `${handler.obj.name}.${handler.fn.name}`
    };
  }

    // send response back if neccesary
    sendResponseBack$(msg) {
      return Rx.Observable.of(msg)
        .mergeMap(({ response, correlationId, replyTo }) => {
          if (replyTo) {
            return broker.send$(
              replyTo,
              "gateway.graphql.Query.response",
              response,
              { correlationId }
            );
          } else {
            return Rx.Observable.of(undefined);
          }
        })
    }

  stop$() {
    Rx.Observable.from(this.subscriptions).map(subscription => {
      subscription.subscription.unsubscribe();
      return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  /////////////////// CONFIG SECTION, ASSOC EVENTS AND PROCESSORS BELOW  /////////////////
  ////////////////////////////////////////////////////////////////////////////////////////

  /**
   * returns an array of broker subscriptions for listening to GraphQL requests
   */
  getSubscriptionDescriptors() {
    //default on error handler
    const onErrorHandler = error => {
      console.error("Error handling  GraphQl incoming event", error);
      process.exit(1);
    };

    //default onComplete handler
    const onCompleteHandler = () => {
      () => console.log("GraphQlService incoming event subscription completed");
    };
    console.log("GraphQl Service starting ...");

    return [
      {
        aggregateType: "User",
        messageType: "gateway.graphql.mutation.createUser",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.mutation.updateUserGeneralInfo",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.mutation.updateUserState",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.mutation.resetUserPassword",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.mutation.addRolesToTheUser",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.mutation.removeRolesFromUser",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.query.getUsers",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.query.getUser",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.query.getUserCount",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.query.getRoles",
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: "User",
        messageType: "gateway.graphql.query.getUserRoleMapping",
        onErrorHandler,
        onCompleteHandler
      },
    ];
  }

  /**
   * returns a map that assocs GraphQL request with its processor
   */
  generateFunctionMap() {
    return {
      "gateway.graphql.mutation.createUser": {
        fn: user.createUser$,
        obj: user
      },
      "gateway.graphql.mutation.updateUserGeneralInfo": {
        fn: user.updateUserGeneralInfo$,
        obj: user
      },
      "gateway.graphql.mutation.updateUserState": {
        fn: user.updateUserState$,
        obj: user
      },
      'gateway.graphql.mutation.resetUserPassword': {
        fn: user.resetUserPassword$,
        obj: user
      },
      'gateway.graphql.mutation.addRolesToTheUser': {
        fn: user.addRolesToTheUser$,
        obj: user
      },
      'gateway.graphql.mutation.removeRolesFromUser': {
        fn: user.removeRolesFromUser$,
        obj: user
      },
      'gateway.graphql.query.getUserCount': {
        fn: user.getUserCount$,
        obj: user
      },
      'gateway.graphql.query.getUsers': {
        fn: user.getUsers$,
        obj: user
      },
      'gateway.graphql.query.getUser': {
        fn: user.getUser$,
        obj: user
      },
      'gateway.graphql.query.getRoles': {
        fn: user.getRoles$,
        obj: user
      },
      'gateway.graphql.query.getUserRoleMapping': {
        fn: user.getUserRoleMapping$,
        obj: user
      }
    };
  }
}

module.exports = () => {
  if (!instance) {
    instance = new GraphQlService();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
