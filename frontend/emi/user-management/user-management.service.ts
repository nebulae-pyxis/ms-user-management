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
 * Gets the users filtered by page, count and a search filter.
 * @param pageValue Page number of the user table that you want to recover.
 * @param countValue Max amount of user that will be return
 * @param searchFilter Search filter (Username, name, email)
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

}

