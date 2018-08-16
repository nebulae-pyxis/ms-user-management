"use strict";

const Rx = require("rxjs");
const KeycloakDA = require("./KeycloakDA").singleton();

class UserKeycloakDA {

  // static getUsersFilter(){
  //   return Rx.Observable.defer(() =>
  //   KeycloakDA.keycloakClient.users.count(
  //     process.env.KEYCLOAK_USERS_REALM_NAME
  //   )
  // )
  //   //According to the amount of user, it generates ranges which will help us to get the users by batches
  //   .mergeMap(usersCount =>
  //     Rx.Observable.range(0, Math.ceil(usersCount / paginationCount))
  //   )
  //   //Gets the users from Keycloak
  //   .concatMap(page => {
  //     const optionsFilter = {
  //       first: 100 * page,
  //       max: paginationCount,
  //       search: searchFilter,
  //       username: username
  //     };
  //     return KeycloakDA.keycloakClient.users.find(
  //       process.env.KEYCLOAK_USERS_REALM_NAME,
  //       optionsFilter
  //     );
  //   })
  // }

  /**
   * Gets the users paging
   * @param {*} page
   * @param {*} paginationCount
   * @param {*} searchFilter
   * @param {*} businessId
   * @param {*} username
   */
  static getUsers$(page, paginationCount, searchFilter, businessId, username) {
    //Gets the amount of user registered on Keycloak
    return (
      Rx.Observable.defer(() =>
        KeycloakDA.keycloakClient.users.count(
          process.env.KEYCLOAK_USERS_REALM_NAME
        )
      )
        //According to the amount of user, it generates ranges which will help us to get the users by batches
        .mergeMap(usersCount =>
          Rx.Observable.range(0, Math.ceil(usersCount / paginationCount))
        )
        //Gets the users from Keycloak
        .concatMap(page => {
          const optionsFilter = {
            first: 100 * page,
            max: paginationCount,
            search: searchFilter,
            username: username
          };
          return KeycloakDA.keycloakClient.users.find(
            process.env.KEYCLOAK_USERS_REALM_NAME,
            optionsFilter
          );
        })
        .mergeMap(users => Rx.Observable.from(users))
        // We can only return the users belonging to the same business of the user that is making the query.
        .filter(
          user =>
            user.attributes &&
            user.attributes.businessId &&
            user.attributes.businessId[0] == businessId
        )
        .map(result => {
          const attributes = result.attributes;
          const user = {
            id: result.id,
            username: result.username,
            generalInfo: {
              name: result.firstName ? result.firstName : "",
              lastname: result.lastName ? result.lastName : "",
              documentType: !attributes || !attributes.documentType? undefined: attributes.documentType[0],
              documentId: !attributes || !attributes.documentId ? undefined : attributes.documentId[0],
              email: result.email,
              phone: !attributes || !attributes.phone ? undefined: attributes.phone[0]
            },
            state: result.enabled
          };
          return user;
        })
        .skip(paginationCount * page)
        .take(paginationCount)
        .toArray()
    );

    // return Rx.Observable.defer(() => {
    //   return KeycloakDA.keycloakClient.users.find(KEYCLOAK_REALM_NAME);
    // }).mergeMap(array => Rx.Observable.from(array))
    // .map(result => {

    //   const attributes = result.attributes;
    //   const user = {
    //     id: result.id,
    //     username: result.username,
    //     name: result.firstName ? result.firstName: '',
    //     lastname: result.lastName ? result.lastName: '',
    //     documentType: !attributes || !attributes.documentType ? undefined: attributes.documentType[0],
    //     documentId: !attributes || !attributes.documentId ? undefined: attributes.documentId[0],
    //     email: result.email,
    //     phone: !attributes || !attributes.phone ? undefined: attributes.phone[0],
    //     state: result.enabled
    //   };

    //   return user;
    // })
    // .toArray();
  }

  /**
   * Gets an user by its username
   */
  static getUser$(username, businessId) {
    return this.getUsers$(0, 1, undefined, businessId, username)
    .map(users => {
      if(!users || users.length == 0){        
        return null;
      }
      return users[0];
    });
  }

    /**
   * Gets an user by its username
   */
  static getUser$(username, businessId) {
    return this.getUsers$(0, 1, undefined, businessId, username)
    .map(users => {
      if(!users || users.length == 0){        
        return null;
      }
      return users[0];
    });
  }
}

module.exports = UserKeycloakDA;
