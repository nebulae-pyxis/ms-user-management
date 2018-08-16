import { query } from '@angular/animations';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { GatewayService } from '../../../../api/gateway.service';
import * as Rx from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {
  getUser,
  createUser
} from '../gql/UserManagement';

@Injectable()
export class UserFormService {

  routeParams: any;
  user: any;
  onUserChanged: BehaviorSubject<any> = new BehaviorSubject({});


  constructor(private gateway: GatewayService) {

  }

    /**
     * Route resolver
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        this.routeParams = route.params;
        if ( this.routeParams.id === 'new' )
        {
            this.onUserChanged.next(false);
            return Rx.Observable.of(undefined);
        }else{
          return this.getUser$(this.routeParams.username);
        }
    }

  /**
   * Gets the users by its username
   * @param username
   */
  getUser$(username) {
    return this.gateway.apollo
    .query<any>({
      query: getUser,
      variables: {
        username: username
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

    /**
   * Creates a new user
   * @param user user to be created
   */
  createUser$(user): Observable<any> {
    const userInput = {
      username: user.username,
      name: user.name,
      lastname: user.lastname,
      documentType: user.documentType,
      documentId: user.documentId,
      email: user.email,
      phone: user.phone,
      state: user.state
    };

    return this.gateway.apollo
      .mutate<any>({
        mutation: createUser,
        variables: {
          input: userInput
        },
        errorPolicy: 'all'
      });
  }

}
