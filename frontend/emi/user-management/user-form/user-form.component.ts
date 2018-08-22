import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';
import { TranslateService } from "@ngx-translate/core";
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { MatSnackBar } from '@angular/material';
import { User } from './../model/user.model';
import { UserFormService } from './user-form.service';

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { first, filter, tap, mergeMap } from "rxjs/operators";

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
    private translate: TranslateService,
    private userFormService: UserFormService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
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
      phone: [this.user.generalInfo ? this.user.generalInfo.phone : '']      
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
      password: ['', Validators.compose([
        Validators.required,
        Validators.pattern('^(?=[a-zA-Z0-9.]{8,}$)(?=.*?[a-z])(?=.*?[0-9]).*')
     ])],
      passwordConfirmation: ['', Validators.required],
      temporary: [false, Validators.required]
    }, {validator: this.checkIfMatchingPasswords('password', 'passwordConfirmation')});
  }

  /**
   * Creates the user roles reactive form
   */
  createUserRolesForm(){
    return this.formBuilder.group({      
    });
  }

  checkIfMatchingPasswords(passwordKey: string, passwordConfirmationKey: string) {
    return (group: FormGroup) => {
      let passwordInput = group.controls[passwordKey],
          passwordConfirmationInput = group.controls[passwordConfirmationKey];
      if (passwordInput.value !== passwordConfirmationInput.value) {
        return passwordConfirmationInput.setErrors({notEquivalent: true})
      }
      else {
          return passwordConfirmationInput.setErrors(null);
      }
    }
  }

  /**
   * Creates a new user according to the info entered into the form
   */
  createUser(){
    const data = this.userGeneralInfoForm.getRawValue();        
    data.username = data.username.trim();
    data.state = this.userStateForm.getRawValue().state;

    console.log('Creating user ... ', data);
    this.userFormService.createUser$(data)
    .pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      filter((resp: any) => !resp.errors || resp.errors.length === 0),
    ).subscribe(model => {
      this.snackBar.open("El usuario ha sido creada", "Cerrar", {
        duration: 2000
      });

      //this.businessCreated.emit(this.selectedBusiness);
    },
    error => {
      console.log('Error creando usuario ==> ', error);
    });
  }

  /**
   * Updates the user general info according to the info entered into the form
   */
  updateUserGeneralInfo(){
    const data = this.userGeneralInfoForm.getRawValue();        

    console.log('Updating user general info ... ', data);
    this.userFormService.updateUser$(this.user.id, data)
    .pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      filter((resp: any) => !resp.errors || resp.errors.length === 0),
    ).subscribe(model => {
      this.snackBar.open("El usuario ha sido actualizado", "Cerrar", {
        duration: 2000
      });
    },
    error => {
      console.log('Error updating user general info ==> ', error);
    });
  }

  /**
   * Fires when the state of the user is changed.
   * 
   * @param $event 
   */
  onUserStateChange($event){
    if (this.pageType == 'new'){
      return;
    }
    
    console.log('onUserStateChange ==> ', $event);

    this.userFormService.updateUserState$(this.user.id, this.user.username, $event.checked)
    .pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      filter((resp: any) => !resp.errors || resp.errors.length === 0),
    ).subscribe(model => {
      this.snackBar.open("El estado del usuario ha sido actualizado", "Cerrar", {
        duration: 2000
      });
    },
    error => {
      console.log('Error updating user state ==> ', error);
    });
  }

  /**
   * Reset the user password
   */
  resetUserPassword(){
    const data = this.userCredentialsForm.getRawValue(); 

    console.log('reset user password ...', data);
    this.userFormService.resetUserPassword$(this.user.id, data)
    .pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      filter((resp: any) => !resp.errors || resp.errors.length === 0),
    ).subscribe(model => {
      this.snackBar.open("El usuario ha sido actualizado", "Cerrar", {
        duration: 2000
      });
      this.userCredentialsForm.reset();
    },
    error => {
      console.log('Error resetting user password ==> ', error);
      this.snackBar.open("Error reseteando contraseña del usuario", "Cerrar", {
        duration: 2000
      });
      this.userCredentialsForm.reset();
    });
  }

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

}
