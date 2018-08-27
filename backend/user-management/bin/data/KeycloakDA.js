"use strict";

const Rx = require("rxjs");
const KeycloakAdminClient = require('@nebulae/keycloak-admin-client');
let instance = null;

class KeycloakDA {
  /**
   * initialize and configure keycloak admin client
   * @param { { url, dbName } } ops
   */
  constructor({realmName, baseUrl, username, password, grant_type, client_id }) {
    this.settings = {realmName, baseUrl, username, password, grant_type, client_id};
    this.keycloakAdmin = new KeycloakAdminClient(this.settings);
  }

  /**
   * Starts Keycloak connections
   * @returns {Rx.Observable} Observable that resolve to the Keycloak client
   */
  start$() {
    console.log("KeycloakDA.start$()... ");
    return this.keycloakAdmin.start$().map(
        client => {
          this.keycloakClient = client;        
          return `Keycloak admin client started= ${this.settings.baseUrl}`;
        }
      );
  }

  /**
   * Starts Keycloak connections and execute the token refresher ()
   * @returns {Rx.Observable} Observable that resolve to the Keycloak client
   */
  startAndExecuteTokenRefresher$() {
    return this.start$()
    .mergeMap(res => {
      return this.keycloakAdmin.startTokenRefresher$()
      .map(
          client => {
            this.keycloakClient = client;        
            return `Keycloak admin client token refresher started= ${this.settings.baseUrl}`;
          }
      );
    })
    
  }


  /**
   * Stops DB connections
   * Returns an Obserable that resolve to a string log
   */
  stop$() {
    return Rx.Observable.create(observer => {
      //this.client.close();
      observer.next("Keycloak admin client stopped");
      observer.complete();
    });
  }

}

module.exports = {
  singleton() {
    if (!instance) {        
      instance = new KeycloakDA({ 
        realmName: process.env.KEYCLOAK_BACKEND_REALM_NAME,
        baseUrl: process.env.KEYCLOAK_BACKEND_BASE_URL,
        username: process.env.KEYCLOAK_BACKEND_USER, 
        password: process.env.KEYCLOAK_BACKEND_PASSWORD,
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID,
    });
      console.log(`KeycloakDA instance created`);
    }
    return instance;
  }
};
