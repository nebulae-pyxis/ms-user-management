"use strict";

const Rx = require("rxjs");
const UserKeycloakDA = require("../data/UserKeycloakDA");
const broker = require("../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class UserEventConsumer {
  constructor() {}

  /**
   * Persists the user on the materialized view according to the received data from the event store.
   * @param {*} userCreatedEvent User created event
   */
  handleUserCreated$(userCreatedEvent) {
    const user = userCreatedEvent.data;
    return UserKeycloakDA.createUser$(user).mergeMap(result => {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result.ops[0]
      );
    });
  }

  /**
   * updates the user attributes on the materialized view according to the received data from the event store.
   * @param {*} userAttributesUpdatedEvent user attributes updated event
   */
  handleUserAttributesUpdated$(userAttributesUpdatedEvent) {
    const userAttributes = userAttributesUpdatedEvent.data;
    return UserKeycloakDA.updateUserAttributes$(
      userAttributesUpdatedEvent.aid,
      userAttributes
    ).mergeMap(result => {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    });
  }

  /**
   * updates the user password on the materialized view according to the received data from the event store.
   * @param {*} userAttributesUpdatedEvent user attributes updated event
   */
  handleUserPasswordChanged$(userPasswordChangedEvent) {
    const userPassword = userPasswordChangedEvent.data;
    return UserKeycloakDA.updateUserPassword$(
      userPasswordChangedEvent.aid,
      userPassowrd
    ).mergeMap(result => {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    });
  }

  /**
   * updates the user state on the materialized view according to the received data from the event store.
   * @param {*} userState events that indicates the new state of the user
   */
  handleUserState$(userStateEvent) {
    return UserKeycloakDA.changeUserState$(
      userStateEvent.aid,
      userStateEvent.data
    ).mergeMap(result => {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    });
  }

  /**
   * updates the user role on the materialized view according to the received data from the event store.
   * @param {*} userRoleChanged events that indicates the new state of the user
   */
  handleUserRoleChanged$(userStateEvent) {
    return UserKeycloakDA.changeUserRole$(
      userStateEvent.aid,
      userStateEvent.data
    ).mergeMap(result => {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    });
  }

  
}

module.exports = () => {
  if (!instance) {
    instance = new UserEventConsumer();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
