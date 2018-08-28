import {TranslateService} from '@ngx-translate/core';
import {MatPaginatorIntl} from '@angular/material';
import {Injectable} from '@angular/core';

@Injectable()
export class CustomTest extends MatPaginatorIntl {
  ofLabel: String;
  constructor(private translate: TranslateService) {
    super();
  }

//  getRangeLabel = (page: number, pageSize: number, length: number) =>  {
//     return '';
//   }

  getRangeLabel = (page: number, pageSize: number, totalResults: number) => {
    if (!totalResults) { return 'No result'; }
    totalResults = Math.max(totalResults, 0);
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex =
      startIndex < totalResults ?
        Math.min(startIndex + pageSize, totalResults) :
        startIndex + pageSize; return `${startIndex + 1} - ${endIndex} sur ${totalResults}`
      ;
  }
}