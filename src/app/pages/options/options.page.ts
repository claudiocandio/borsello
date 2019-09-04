import { Component, OnInit } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { AlertController, LoadingController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { Clipboard } from '@ionic-native/clipboard/ngx';

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

  public mypw_checked: boolean
  public mypw_toggle: boolean
  private mypw_old = ''
  private mypw_new = ''
  private mypws_ok: boolean

  constructor(
    private nativeStorage: NativeStorage,
    public irohautil: IrohautilService,
    private alertController: AlertController,
    public loadingController: LoadingController,
    private clipboard: Clipboard
  ) {

    this.show_mypuk_barcode = false
    this.show_myprk_barcode = false
    this.nodeIp_changed = false

    this.mypw_checked = this.irohautil.wallet.mypw
    this.mypw_toggle = this.irohautil.wallet.mypw
    this.mypws_ok = false

  }

  ngOnInit() {

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

    if (this.irohautil.wallet.mypuk != null)
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
        this.irohautil.alert("Indirizzo Server modificato")

        if (this.irohautil.wallet.mywallet)
          return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
            .catch((err) => {
              console.log(JSON.stringify(err))
            })

      })
      .catch((err) => {
        console.log("options.page.nodeIp_change - "+err)
        this.irohautil.alert("Errore salva Server");
      })
  }

  async rmkeys_confirm() {
    const alert = await this.alertController.create({
      header: 'Conferma cancellazione!',
      message: '<strong>Il Wallet verrà cancellato! Sei sicuro?</strong>',
      buttons: [
        {
          text: 'Annulla',
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
      message: 'Rimozione Wallet in corso...',
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout
    })
    loading.onDidDismiss().then(() => {
      if(!loading_done) this.irohautil.alert("Timeout nessuna risposta ricevuta")
    })
    loading.present().then(async () => {

      await this.irohautil.rmkeys()
        .then(_ => {
          this.irohautil.wallet_close("Rimozione Wallet completata")
        })
        .catch((err) => {
          console.log(err)
          this.irohautil.wallet_close("Errore rimozione Wallet")
        })

      loading_done = true
      loading.dismiss()

    })

  }

  async mypw_toggle_change() {

    if (!this.mypw_toggle && this.mypw_checked && this.irohautil.wallet.mypw) {

      const alert = await this.alertController.create({
        header: 'Conferma',
        message: '<strong>Inserire password Wallet per confermare la rimozione della password</strong>',

        inputs: [
          {
            name: 'password',
            placeholder: 'Password',
            type: 'password'
          }
        ],
        buttons: [
          {
            text: 'Annulla',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              this.mypw_toggle = true
              this.mypw_checked = true
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

    } else {
      this.mypw_checked = true
    }

  }

  mypws_ionchange() {
    /* ok for check old_password, newpass1, newpass2_confirm
        if (
          this.irohautil.wallet.mypw && // if wallet exists and it is encrypted
          this.mypw_old.length > 0 &&
          this.mypw_new1.length > 0 &&
          this.mypw_new1 == this.mypw_new2
        )
          this.mypws_ok = true
        else if (
          !this.irohautil.wallet.mypw &&  //if wallet exists and it is not encrypted
          this.irohautil.wallet.mypuk &&  // if wallet exists and not encrypted
          this.mypw_new1.length > 0 &&
          this.mypw_new1 == this.mypw_new2
        )
          this.mypws_ok = true
        else
          this.mypws_ok = false
    */
    if (
      this.irohautil.wallet.mypw && // if wallet exists and it is encrypted
      this.mypw_old.length > 0 &&
      this.mypw_new.length > 0 &&
      this.mypw_old != this.mypw_new
    )
      this.mypws_ok = true
    else if (
      !this.irohautil.wallet.mypw &&  //if wallet exists and it is not encrypted
      this.irohautil.wallet.mypuk &&  // if wallet exists and not encrypted
      this.mypw_new.length > 0
    )
      this.mypws_ok = true
    else
      this.mypws_ok = false

  }

  async password_save() {

    if (this.irohautil.wallet.mypw) {  // change password
      let wal_enc; let wal;

      // get encrypted wallet from nativestorage
      await this.nativeStorage.getItem('mywallet')
        .then(async mywallet => {
          wal_enc = mywallet
        })

      // check whether old password is ok
      wal = await this.irohautil.decrypt_mypw(wal_enc, this.mypw_old)
      if (wal.length > 0) { // old password is ok

        await this.save_newpassword(true)

        this.mypw_old = ''
        this.mypw_new = ''

        this.irohautil.alert("Password Wallet cambiata")

      } else this.irohautil.alert("Vecchia password Wallet errata")

    } else { // add password

      this.irohautil.wallet.mypw = true
      await this.save_newpassword(true)

      this.mypw_old = ''
      this.mypw_new = ''

      this.irohautil.alert("Password Wallet aggiunta")

    }

  }

  private async save_newpassword(doencrypt) {
    let wal; let prk; let puk

    if (doencrypt) {
      wal = await this.irohautil.encrypt_mypw(this.irohautil.wallet.mywallet, this.mypw_new)
      puk = await this.irohautil.encrypt_mypw(this.irohautil.wallet.mypuk, this.mypw_new)
      prk = await this.irohautil.encrypt_mypw(this.irohautil.wallet.myprk, this.mypw_new)
    } else {
      wal = this.irohautil.wallet.mywallet
      puk = this.irohautil.wallet.mypuk
      prk = this.irohautil.wallet.myprk

    }
    this.nativeStorage.setItem('mypw', this.irohautil.wallet.mypw)
      .catch(err => this.irohautil.alert("Error storing mypw: " + JSON.stringify(err)));

    this.nativeStorage.setItem('mywallet', wal)
      .catch(err => this.irohautil.alert("Error storing mywallet: " + JSON.stringify(err)));

    this.nativeStorage.setItem('mypuk', puk)
      .catch(err => this.irohautil.alert("Error storing mypuk: " + JSON.stringify(err)));

    this.nativeStorage.setItem('myprk', prk)
      .catch(err => this.irohautil.alert("Error storing myprk: " + JSON.stringify(err)));

  }

  private async password_remove_ok(old_password) {

    let wal_enc; let wal;

    // get encrypted wallet from nativestorage
    await this.nativeStorage.getItem('mywallet')
      .then(async mywallet => {
        wal_enc = mywallet
      })

    // check whether old password is ok
    wal = await this.irohautil.decrypt_mypw(wal_enc, old_password)
    if (wal.length > 0) { // old password is ok

      this.irohautil.wallet.mypw = false
      await this.save_newpassword(false)

      this.mypw_old = ''
      this.mypw_new = ''

      this.mypw_checked = false
      this.mypw_toggle = false
      this.irohautil.alert("Password Wallet rimossa")

    } else {

      this.mypw_checked = true
      this.mypw_toggle = true
      this.irohautil.alert("Vecchia password Wallet errata")

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

  copyToClipboard(field) {
    if (field == 'mypuk') {
      this.clipboard.copy(this.irohautil.wallet.mypuk)
        .catch((err) => console.log(err))
    } else if (field == 'myprk') {
      this.clipboard.copy(this.irohautil.wallet.myprk)
        .catch((err) => console.log(err))
    } else if (field == 'Wallet') {
      //console.log("Wallet: " + this.irohautil.wallet.mywallet + "\nChiave Privata: " + this.irohautil.wallet.myprk)
      this.clipboard.copy("Wallet: " + this.irohautil.wallet.mywallet + "\nChiave Privata: " + this.irohautil.wallet.myprk)
        .then(() => this.irohautil.alert("Wallet copiato negli appunti"))
        .catch((err) => console.log(err))
    }

  }

}
