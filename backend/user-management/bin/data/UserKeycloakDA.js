'use strict'

const Rx = require('rxjs');
const KeycloakDA = require('./KeycloakDA').singleton();

class UserKeycloakDA {

/**
 * Gets the users paging
 * @param {*} page 
 * @param {*} paginationCount 
 * @param {*} searchFilter 
 * @param {*} businessId 
 */
  static getUsers$(page, paginationCount, searchFilter, businessId) {    
    //Gets the amount of user registered on Keycloak
    return Rx.Observable.defer(() => KeycloakDA.keycloakClient.users.count(process.env.KEYCLOAK_USERS_REALM_NAME))
    //According to the amount of user, it generates ranges which will help us to get the users by batches
    .mergeMap(usersCount => Rx.Observable.range(0, Math.ceil(usersCount/paginationCount)))
    //Gets the users by pages
    .concatMap(page => {
      return KeycloakDA.keycloakClient.users.find(process.env.KEYCLOAK_USERS_REALM_NAME, {first: 100*page, max: paginationCount})
    })
    .mergeMap(users => Rx.Observable.from(users))
    // We can only return the users belonging to the same business of the user that is making the query.
    .filter(user => user.attributes && user.attributes.businessId && user.attributes.businessId[0] == businessId)
    .map(result => {      
      const attributes = result.attributes;
      const user = {
        id: result.id,
        username: result.username,        
        name: result.firstName ? result.firstName: '',
        lastname: result.lastName ? result.lastName: '',
        documentType: !attributes || !attributes.documentType ? undefined: attributes.documentType[0],
        documentId: !attributes || !attributes.documentId ? undefined: attributes.documentId[0],
        email: result.email,        
        phone: !attributes || !attributes.phone ? undefined: attributes.phone[0],        
        state: result.enabled
      };  
      return user;
    })
    .skip(paginationCount * page)
    .take(paginationCount)
    .toArray();

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
  
}

module.exports =  UserKeycloakDA 