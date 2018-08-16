import { UserManagementService } from './user-management.service';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "./../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "./i18n/en";
import { locale as spanish } from "./i18n/es";

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  Sort,
  MatTableDataSource,
  MatDialog,
  MatSnackBar
} from '@angular/material';
import { fuseAnimations } from '../../../core/animations';

//////////// RXJS ////////////
import * as Rx from "rxjs/Rx";
import { of, fromEvent } from "rxjs";
import {
  first,
  filter,
  tap,
  mergeMap,
  debounceTime,
  distinctUntilChanged
} from "rxjs/operators";
import { Subscription } from "rxjs/Subscription";

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  animations: fuseAnimations
})
export class UserManagementComponent implements OnInit, OnDestroy {
  // Rxjs subscriptions
  subscriptions = [];
  // Table data
  dataSource = new MatTableDataSource();
  // Columns to show in the table
  displayedColumns = ['username', 'fullname', 'doc_type', 'doc_id', 'state'];

  // Table values
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  tableSize: number;
  page = 0;
  count = 10;
  searchFilter = '';
  sortColumn = null;
  sortOrder = null;
  itemPerPage = '';

  selectedUser: any;

  constructor(
    private userManagementService: UserManagementService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    // this.helloWorldLabelQuery$ = this.UserManagementervice.getHelloWorld$();
    // this.helloWorldLabelSubscription$ = this.UserManagementervice.getEventSourcingMonitorHelloWorldSubscription$();

    // Refresh the users table
    this.refreshDataTable(
      this.page,
      this.count,
      this.searchFilter
    );
  }

    /**
   * Finds the users and updates the table data
   * @param page page number
   * @param count Limits the number of documents in the result set
   * @param searchFilter Search filter
   */
  refreshDataTable(page, count, searchFilter) {
    this.userManagementService
      .getUsers$(page, count, searchFilter)
      .pipe(
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
      ).subscribe(model => {
        console.log('Refresh table ==> ', model);

        this.dataSource.data = model.data.getUsers;
      });
  }

  /**
   * Handles the Graphql errors and show a message to the user
   * @param response
   */
  graphQlAlarmsErrorHandler$(response){
    return Rx.Observable.of(JSON.parse(JSON.stringify(response)))
    .pipe(
      tap((resp: any) => {
        this.showSnackBarError(resp);
        return resp;
      })
    );
  }

  /**
   * Shows an error snackbar
   * @param response
   */
  showSnackBarError(response){
    if (response.errors){

      if (Array.isArray(response.errors)) {
        response.errors.forEach(error => {
          if (Array.isArray(error)) {
            error.forEach(errorDetail => {
              this.showMessageSnackbar('ERRORS.' + errorDetail.message.code);
            });
          }else{
            response.errors.forEach(error => {
              this.showMessageSnackbar('ERRORS.' + error.message.code);
            });
          }
        });
      }
    }
  }

  /**
   * Shows a message snackbar on the bottom of the page
   * @param messageKey Key of the message to i18n
   * @param detailMessageKey Key of the detail message to i18n
   */
  showMessageSnackbar(messageKey, detailMessageKey?){
    let translationData = [];
    if(messageKey){
      translationData.push(messageKey);
    }

    if(detailMessageKey){
      translationData.push(detailMessageKey);
    }

    this.translate.get(translationData)
    .subscribe(data => {
      this.snackBar.open(
        messageKey ? data[messageKey]: '',
        detailMessageKey ? data[detailMessageKey]: '',
        {
          duration: 2000
        }
      );
    });
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }

}
