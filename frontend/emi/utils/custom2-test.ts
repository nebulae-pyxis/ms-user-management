import {TranslateService} from '@ngx-translate/core';
import {MatPaginatorIntl} from '@angular/material';
import {Injectable} from '@angular/core';

@Injectable()
export class CustomMatPaginatorIntl extends MatPaginatorIntl {
  ofLabel: String;
  constructor(private translate: TranslateService) {
    super();
  }

 getRangeLabel = (page: number, pageSize: number, length: number) =>  {
    return '';
  }
}