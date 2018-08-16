import { query } from '@angular/animations';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as Rx from 'rxjs';
import { GatewayService } from '../../../api/gateway.service';
import {
  getUsers
} from './gql/UserManagement';

@Injectable()
export class UserManagementService {


  constructor(private gateway: GatewayService) {

  }

/**
 * Gets the users
 * @param pageValue
 * @param countValue
 * @param searchFilter
 */
  getUsers$(pageValue, countValue, searchFilter){
    return this.gateway.apollo
    .query<any>({
      query: getUsers,
      variables: {
        page: pageValue,
        count: countValue,
        searchFilter: searchFilter
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

//   /**
//   * Hello World subscription sample, please remove
//   */
//  getEventSourcingMonitorHelloWorldSubscription$(): Observable<any> {
//   return this.gateway.apollo
//     .subscribe({
//       query: UserManagementHelloWorldSubscription
//     })
//     .map(resp => resp.data.EventSourcingMonitorHelloWorldSubscription.sn);
// }

}
