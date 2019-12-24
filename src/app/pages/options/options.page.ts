import { Component, OnInit } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { AlertController, LoadingController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { TranslateService } from '@ngx-translate/core';

import { IrohautilService } from '../../services/irohautil.service'


@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
})
export class OptionsPage implements OnInit {

  public show_mypuk_barcode: boolean
  public show_myprk_barcode: boolean
  public nodeIp = this.irohautil.nodeIp
  public nodeIp_changed: boolean
  public pageTxs = this.irohautil.pageTxs
  public pageTxs_changed: boolean

  public mywalletpw_checked: boolean
  public mywalletpw_toggle: boolean
  private mywalletpw_old = ''
  private mywalletpw_new = ''
  private mywalletpw_new2 = ''
  private mywalletpws_ok: boolean

  languages = [];
  select_language($event) {
    if(this.irohautil.lang_selected != $event.detail.value){
      this.irohautil.setLanguage($event.detail.value)
    }
  }

  constructor(
    private nativeStorage: NativeStorage,
    public irohautil: IrohautilService,
    private alertController: AlertController,
    public loadingController: LoadingController,
    private clipboard: Clipboard,
    private translate: TranslateService
  ) {

    this.show_mypuk_barcode = false
    this.show_myprk_barcode = false
    this.nodeIp_changed = false
    this.pageTxs_changed = false

    this.mywalletpw_checked = this.irohautil.wallet.mywalletIsEncrypted
    this.mywalletpw_toggle = this.irohautil.wallet.mywalletIsEncrypted
    this.mywalletpws_ok = false

  }

  ngOnInit() {
    this.languages = this.irohautil.getLanguages()
  }

  mypuk_barcode_toggle_change() {

    if (this.irohautil.wallet.mypuk != null)
      if (this.show_mypuk_barcode) {
        this.show_mypuk_barcode = false
      } else {
        this.show_mypuk_barcode = true
      }

  }

  myprk_barcode_toggle_change() {

    if (this.irohautil.wallet.myprk != null)
      if (this.show_myprk_barcode) {
        this.show_myprk_barcode = false
      } else {
        this.show_myprk_barcode = true
      }

  }

  nodeIp_change() {

    if (this.nodeIp != this.irohautil.nodeIp) {
      this.nodeIp_changed = true
    } else {
      this.nodeIp_changed = false
    }

  }

  nodeIp_save() {

    this.nativeStorage.setItem('nodeIp', this.nodeIp)
      .then(() => {
        this.irohautil.nodeIp = this.nodeIp
        this.nodeIp_changed = false
        this.irohautil.alert( this.translate.instant('OPTIONS.saved') )

        if (this.irohautil.wallet.mywallet)
          return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
            .catch((err) => {
              this.irohautil.console_log(JSON.stringify(err))
            })

      })
      .catch((err) => {
        this.irohautil.console_log("options.page.nodeIp_change - " + err)
        this.irohautil.alert( this.translate.instant('OPTIONS.save_error') )
      })
  }

  pageTxs_change() {

    if (this.pageTxs != this.irohautil.pageTxs && this.pageTxs > 0) {
      this.pageTxs_changed = true
    } else {
      this.pageTxs_changed = false
    }

  }

  pageTxs_save() {

    this.nativeStorage.setItem('pageTxs', this.pageTxs)
      .then(() => {
        this.irohautil.pageTxs = this.pageTxs
        this.pageTxs_changed = false
        this.irohautil.alert( this.translate.instant('OPTIONS.saved') )
      })
      .catch((err) => {
        this.irohautil.console_log("options.page.pageTxs_change - " + err)
        this.irohautil.alert( this.translate.instant('OPTIONS.save_error') )
      })
  }

  async wallet_close(){
    const alert = await this.alertController.create({
      header: this.translate.instant('COMMON.confirm'),
      message: '<strong>'+this.translate.instant('OPTIONS.wallet_close_confirm')+'</strong>',
      buttons: [
        {
          text: this.translate.instant('COMMON.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'OK',
          handler: () => {
            this.irohautil.wallet_close()
          }
        }
      ]
    });

    await alert.present();
  } 


  async rmkeys_confirm() {
    const alert = await this.alertController.create({
      header: this.translate.instant('OPTIONS.wallet_remove_confirm'),
      message: '<strong>'+this.translate.instant('OPTIONS.wallet_remove_confirm2')+'</strong>',
      buttons: [
        {
          text: this.translate.instant('COMMON.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'OK',
          handler: () => {
            this.rmkeys()
          }
        }
      ]
    });

    await alert.present();
  }

  async rmkeys() {

    let loading_done = false
    const loading = await this.loadingController.create({
      message: this.translate.instant('OPTIONS.wallet_removing'),
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout
    })
    loading.onDidDismiss().then(() => {
      if (!loading_done) this.irohautil.alert( this.translate.instant('COMMON.timeout') )
    })
    loading.present().then(async () => {

      await this.irohautil.rmkeys()
        .then(_ => {
          this.irohautil.wallet_close()
        })
        .catch((err) => {
          this.irohautil.console_log(err)
          this.irohautil.wallet_close()
        })

      loading_done = true
      loading.dismiss()

    })

  }

  async mywalletpw_toggle_change() {

    if (!this.mywalletpw_toggle && this.mywalletpw_checked && this.irohautil.wallet.mywalletIsEncrypted) {

      const alert = await this.alertController.create({
        header: this.translate.instant('COMMON.confirm') ,
        message: '<strong>'+this.translate.instant('OPTIONS.insert_password_confirm')+'</strong>',

        inputs: [
          {
            name: 'password',
            placeholder: 'Password',
            type: 'password'
          }
        ],
        buttons: [
          {
            text: this.translate.instant('COMMON.cancel'),
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              this.mywalletpw_toggle = true
              this.mywalletpw_checked = true
            }
          }, {
            text: 'OK',
            handler: (data) => {
              this.password_remove_ok(data.password)
            }
          }
        ]
      });
      await alert.present();

    } else if(!this.mywalletpw_toggle) {
      this.mywalletpw_checked = false
    } else {
      this.mywalletpw_checked = true
    }

  }

  mywalletpws_ionchange() {

    if (
      this.irohautil.wallet.mywalletIsEncrypted && // if wallet exists and it is encrypted
      this.mywalletpw_old.length > this.irohautil.password_min_len_gt &&
      this.mywalletpw_new.length > this.irohautil.password_min_len_gt &&
      this.mywalletpw_new == this.mywalletpw_new2 &&
      this.mywalletpw_old != this.mywalletpw_new
    )
      this.mywalletpws_ok = true
    else if (
      !this.irohautil.wallet.mywalletIsEncrypted &&  //if wallet exists and it is not encrypted
      this.irohautil.wallet.mypuk &&  // if wallet exists and not encrypted
      this.mywalletpw_new.length > this.irohautil.password_min_len_gt &&
      this.mywalletpw_new == this.mywalletpw_new2
    )
      this.mywalletpws_ok = true
    else
      this.mywalletpws_ok = false

  }

  async password_save() {

    if (this.irohautil.wallet.mywalletIsEncrypted) {  // change password
      let wal_enc; let wal;

      // get encrypted wallet from nativestorage
      await this.nativeStorage.getItem('mywallet')
        .then(async mywallet => {
          wal_enc = mywallet
        })

      // check whether old password is ok
      wal = await this.irohautil.decrypt_mywallet(wal_enc, this.mywalletpw_old)
      if (wal.length > 0) { // old password is ok

        await this.save_newpassword(true)

        this.mywalletpw_old = ''
        this.mywalletpw_new = ''
        this.mywalletpw_new2 = ''

        this.irohautil.alert( this.translate.instant('OPTIONS.wallet_password_changed') )

      } else this.irohautil.alert( this.translate.instant('OPTIONS.wrong_old_password') )

    } else { // add password

      this.irohautil.wallet.mywalletIsEncrypted = true
      await this.save_newpassword(true)

      this.mywalletpw_old = ''
      this.mywalletpw_new = ''
      this.mywalletpw_new2 = ''

      this.irohautil.alert( this.translate.instant('OPTIONS.wallet_password_added') )

    }

  }

  private async save_newpassword(doencrypt) {
    let wal; let prk; let puk

    if (doencrypt) {
      wal = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.mywallet, this.mywalletpw_new)
      puk = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.mypuk, this.mywalletpw_new)
      prk = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.myprk, this.mywalletpw_new)
    } else {
      wal = this.irohautil.wallet.mywallet
      puk = this.irohautil.wallet.mypuk
      prk = this.irohautil.wallet.myprk

    }
    this.nativeStorage.setItem('mywalletIsEncrypted', this.irohautil.wallet.mywalletIsEncrypted)
      .catch(err => this.irohautil.console_log("Error storing mywalletIsEncrypted: " + JSON.stringify(err)));

    this.nativeStorage.setItem('mywallet', wal)
      .catch(err => this.irohautil.console_log("Error storing mywallet: " + JSON.stringify(err)));

    this.nativeStorage.setItem('mypuk', puk)
      .catch(err => this.irohautil.console_log("Error storing mypuk: " + JSON.stringify(err)));

    this.nativeStorage.setItem('myprk', prk)
      .catch(err => this.irohautil.console_log("Error storing myprk: " + JSON.stringify(err)));

  }

  private async password_remove_ok(old_password) {

    let wal_enc; let wal;

    // get encrypted wallet from nativestorage
    await this.nativeStorage.getItem('mywallet')
      .then(async mywallet => {
        wal_enc = mywallet
      })

    // check whether old password is ok
    wal = await this.irohautil.decrypt_mywallet(wal_enc, old_password)
    if (wal.length > 0) { // old password is ok

      this.irohautil.wallet.mywalletIsEncrypted = false
      await this.save_newpassword(false)

      this.mywalletpw_old = ''
      this.mywalletpw_new = ''
      this.mywalletpw_new2 = ''

      this.mywalletpw_checked = false
      this.mywalletpw_toggle = false
      this.irohautil.alert( this.translate.instant('OPTIONS.wallet_password_removed') )

    } else {

      this.mywalletpw_checked = true
      this.mywalletpw_toggle = true
      this.irohautil.alert( this.translate.instant('OPTIONS.wrong_old_password') )

    }

  }

  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';
  hideShowPassword() {
    this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
    this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }

  passwordType_new: string = 'password';
  passwordIcon_new: string = 'eye-off';
  hideShowPassword_new() {
    this.passwordType_new = this.passwordType_new === 'text' ? 'password' : 'text';
    this.passwordIcon_new = this.passwordIcon_new === 'eye-off' ? 'eye' : 'eye-off';
  }

  passwordType_new2: string = 'password';
  passwordIcon_new2: string = 'eye-off';
  hideShowPassword_new2() {
    this.passwordType_new2 = this.passwordType_new2 === 'text' ? 'password' : 'text';
    this.passwordIcon_new2 = this.passwordIcon_new2 === 'eye-off' ? 'eye' : 'eye-off';
  }


  copyToClipboard(field) {
    if (field == 'mypuk') {
      this.irohautil.console_log(this.irohautil.wallet.mypuk)
      this.clipboard.copy(this.irohautil.wallet.mypuk)
        .then(() => this.irohautil.alert( this.translate.instant('OPTIONS.public_key_copied') ))
        .catch((err) => this.irohautil.console_log(err))
    } else if (field == 'myprk') {
      this.irohautil.console_log(this.irohautil.wallet.myprk)
      this.clipboard.copy(this.irohautil.wallet.myprk)
        .then(() => this.irohautil.alert( this.translate.instant('OPTIONS.private_key_copied') ))
        .catch((err) => this.irohautil.console_log(err))
    } else if (field == 'wallet') {
      this.irohautil.console_log(
        this.translate.instant('WALLET.tab') + ": " + 
        this.irohautil.wallet.mywallet + "\n"+ this.translate.instant('OPTIONS.private_key') + 
        ": " + this.irohautil.wallet.myprk
        )
      this.clipboard.copy(
        this.translate.instant('WALLET.tab') + ": " + 
        this.irohautil.wallet.mywallet + "\n"+ this.translate.instant('OPTIONS.private_key') + 
        ": " + this.irohautil.wallet.myprk
        )
        .then(() => this.irohautil.alert( this.translate.instant('OPTIONS.wallet_copied') ))
        .catch((err) => this.irohautil.console_log(err))
    }

  }

}
