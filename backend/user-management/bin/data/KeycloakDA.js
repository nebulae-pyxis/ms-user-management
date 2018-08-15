"use strict";

const Rx = require("rxjs");
const KeycloakAdminClient = require('@nebulae/keycloak-admin-client');
let instance = null;

class KeycloakDA {
  /**
   * initialize and configure keycloak admin client
   * @param { { url, dbName } } ops
   */
  constructor({ baseUrl, username, password, grant_type, client_id }) {
    this.settings = {baseUrl, username, password, grant_type, client_id};
    this.keycloakAdmin = new KeycloakAdminClient(this.settings);

    // const settings = {
    //   baseUrl: "http://127.0.0.1:8080/auth",
    //   username: "keycloak",
    //   password: "keycloak",
    //   grant_type: "password",
    //   client_id: "admin-cli"
    // };
  }

  /**
   * Starts DB connections
   * @returns {Rx.Observable} Obserable that resolve to the DB client
   */
  start$() {
    console.log("KeycloakDA.start$()... ");
    return this.keycloakAdmin.start$().map(
        client => {
          console.log(this.url);
          this.keycloakClient = client;        
          return `Keycloak admin client started= ${this.settings.baseUrl}`;
        }
      );
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
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        username: process.env.KEYCLOAK_USERNAME, 
        password: process.env.KEYCLOAK_PASSWORD,
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_CLIENT_ID,
    });
      console.log(`KeycloakDA instance created`);
    }
    return instance;
  }
};
