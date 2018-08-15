import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as Rx from 'rxjs';
import { GatewayService } from '../../../api/gateway.service';
import {
  getHelloWorld,
  UserManagementHelloWorldSubscription
} from './gql/UserManagement';

@Injectable()
export class UserManagementService {


  constructor(private gateway: GatewayService) {

  }

  /**
   * Gets the users filtered according to the given parameters
   * 
   * @param pageValue
   * @param countValue
   * @param filterText
   * @param sortColumn
   * @param sortOrder
   */
  getUsers$(pageValue, countValue, filterText, sortColumn, sortOrder){
    return Rx.Observable.of({});
  }

  /**
   * Hello World sample, please remove
   */
  getHelloWorld$() {
    return this.gateway.apollo
      .watchQuery<any>({
        query: getHelloWorld,
        fetchPolicy: "network-only"
      })
      .valueChanges.map(
        resp => resp.data.getHelloWorldFromUserManagement.sn
      );
  }

  /**
  * Hello World subscription sample, please remove
  */
 getEventSourcingMonitorHelloWorldSubscription$(): Observable<any> {
  return this.gateway.apollo
    .subscribe({
      query: UserManagementHelloWorldSubscription
    })
    .map(resp => resp.data.EventSourcingMonitorHelloWorldSubscription.sn);
}

}
