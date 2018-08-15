import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';
import { TranslateService } from "@ngx-translate/core";
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private location: Location,
    private router: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
   }

  ngOnInit() {
    // this.router.params
    //   .pipe(
    //     mergeMap(params => {
    //       return this.deviceService.getDeviceState(params['id']).pipe(first());
    //     })
    //   )
    //   .subscribe(result => {
    //     this.device = result;
    //     this.deviceVal = JSON.stringify(this.device);
    //   });
  }

}
