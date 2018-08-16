import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';
import { TranslateService } from "@ngx-translate/core";
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { MatSnackBar } from '@angular/material';
import { User } from './../model/user.model';
import { fuseAnimations } from "../../../../core/animations";

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {


  // User data
  user = new User();
  pageType: string;
  userGeneralInfoForm: FormGroup;
  userCredentialsForm: FormGroup;
  userRolesForm: FormGroup;
  userStateForm: FormGroup;

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
    this.user = new User(this.router.snapshot.data.data ? this.router.snapshot.data.data.data.getUser : undefined);
    this.pageType = this.user.id ? 'edit' : 'new';

    this.userGeneralInfoForm = this.createUserGeneralInfoForm();
    this.userCredentialsForm = this.createUserCredentialsForm();
    this.userStateForm = this.createUserStateForm();
    this.userRolesForm = this.createUserRolesForm();
    console.log('User page ==> ', this.user);
  }

  /**
   * Creates the user general info reactive form
   */
  createUserGeneralInfoForm(){
    return this.formBuilder.group({
      username: [{
        value: this.user.username,
        disabled: this.pageType != 'new'
      }, Validators.required],
      name: [(this.user.generalInfo ? this.user.generalInfo.name : ''), Validators.required],
      lastname: [(this.user.generalInfo ? this.user.generalInfo.lastname : ''), Validators.required],
      documentType: [(this.user.generalInfo ? this.user.generalInfo.documentType : ''),Validators.required],
      documentId: [(this.user.generalInfo ? this.user.generalInfo.documentId : ''), Validators.required],
      email: [(this.user.generalInfo ? this.user.generalInfo.email : ''), Validators.email],
      phone: [this.user.generalInfo ? this.user.generalInfo.phone : ''],
    });
  }

  /**
   * Creates the user state reactive form
   */
  createUserStateForm(){
    return this.formBuilder.group({
      state: [{
        value: this.user.state,
      }],
    });
  }

  /**
   * Creates the user credentials reactive form
   */
  createUserCredentialsForm(){
    return this.formBuilder.group({
      newPassword: [''],
      passwordConfirmation: [''],
    });
  }

  /**
   * Creates the user roles reactive form
   */
  createUserRolesForm(){
    return this.formBuilder.group({      
    });
  }

  /**
   * Creates a new user according to the info entered into the form
   */
  createUser(){
    console.log('Creating user ...');
  }

  /**
   * Updates the user general info according to the info entered into the form
   */
  updateUserGeneralInfo(){
    console.log('Updating user general info ...');
  }

}
