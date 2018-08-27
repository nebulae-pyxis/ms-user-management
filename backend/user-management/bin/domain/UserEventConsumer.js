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
      console.log('Handle user created: ', result);
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    });
  }

  /**
   * updates the user general info on the materialized view according to the received data from the event store.
   * @param {*} userAttributesUpdatedEvent user general info updated event
   */
  handleUserGeneralInfoUpdated$(userGeneralInfoUpdatedEvent) {
    console.log('userGeneralInfoUpdatedEvent ==> ', userGeneralInfoUpdatedEvent);
    const userGeneralInfo = userGeneralInfoUpdatedEvent.data;
    return UserKeycloakDA.updateUserGeneralInfo$(
      userGeneralInfo.id,
      userGeneralInfo
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
    const userState = userStateEvent.data;
    return UserKeycloakDA.updateUserState$(
      userState.id,
      userState.state
    )
    .mergeMap(result => {
      console.log('handleUserState: ', result);
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    })
    ;
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
 * Adds the specified roles to the user
 * @param {*} userRolesAddedEvent 
 */
  handleUserRolesAdded$(userRolesAddedEvent) {
    console.log('userRolesAddedEvent ==> ', userRolesAddedEvent);
    const data = userRolesAddedEvent.data;
    return UserKeycloakDA.addRolesToTheUser$(
      data.userId,
      data.userRoles.roles
    ).mergeMap(result => {
      return broker.send$(
        MATERIALIZED_VIEW_TOPIC,
        `UserUpdatedSubscription`,
        result
      );
    });
  }

/**
 * Removes the specified roles to the user
 * @param {*} userRolesAddedEvent 
 */
handleUserRolesRemoved$(userRolesRemovedEvent) {
  console.log('userRolesRemovedEvent ==> ', userRolesRemovedEvent);
  const data = userRolesRemovedEvent.data;
  return UserKeycloakDA.removeRolesFromUser$(
    data.userId,
    data.userRoles.roles
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
