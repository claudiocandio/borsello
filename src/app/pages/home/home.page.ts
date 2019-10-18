import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonSelect, LoadingController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';
import { TranslateService } from '@ngx-translate/core';

import { IrohautilService } from '../../services/irohautil.service'
import { derivePublicKey } from 'ed25519.js'

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  constructor(private nativeStorage: NativeStorage,
    private barcodeScanner: BarcodeScanner,
    public irohautil: IrohautilService,
    public loadingController: LoadingController,
    private translate: TranslateService
  ) {

    this.barcodeScannerOptions = {
      showTorchButton: true,
      showFlipCameraButton: true
    }

  }

  private myprk_restore = ''
  public myprk_restore_min = 0
  public mywallet_restore_button = this.translate.instant('WALLET.new')

  private mywalletpws_ok = true
  private mywalletpw_input = ''
  private mywalletpw_input2 = ''

  barcodeScannerOptions: BarcodeScannerOptions;

  async ngOnInit() {

    // just to notify debug is on
    if (this.irohautil.debug_console_log) this.irohautil.alert("debug_console_log=true")

    let loading_done = false
    const loading = await this.loadingController.create({
      message: this.translate.instant('WALLET.loading'),
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout
    })
    loading.onDidDismiss().then(() => {
      if (!loading_done) this.irohautil.alert( this.translate.instant('COMMON.timeout') )
    })
    loading.present().then(async () => {

      if (!this.irohautil.mywalletIsopen) {  // if wallet not open

        if (this.irohautil.nodeIp_force) {
          this.irohautil.nodeIp = this.irohautil.nodeIp_force

          await this.nativeStorage.setItem('nodeIp', this.irohautil.nodeIp_force)
            .catch((err) => {
              this.irohautil.console_log(err)
            })

        } else await this.nativeStorage.getItem('nodeIp').then(
          nodeIp => this.irohautil.nodeIp = nodeIp,
          _ => this.irohautil.nodeIp = this.irohautil.nodeIp_default
        )

        await this.nativeStorage.getItem('mywalletIsEncrypted').then( // check wheter wallet is encrypted
          mywalletIsEncrypted => this.irohautil.wallet.mywalletIsEncrypted = mywalletIsEncrypted,
          _ => this.irohautil.wallet.mywalletIsEncrypted = false
        )

        await this.nativeStorage.getItem('mypuk').then(
          mypuk => this.irohautil.wallet.mypuk = mypuk,
          _ => this.irohautil.wallet.mypuk = null
        )

        await this.nativeStorage.getItem('myprk').then(
          myprk => this.irohautil.wallet.myprk = myprk,
          _ => this.irohautil.wallet.myprk = null
        )

        await this.nativeStorage.getItem('cur_assetId').then(
          cur_assetId => this.irohautil.wallet.cur_assetId = cur_assetId,
          _ => this.irohautil.wallet.cur_assetId = null
        )

        await this.nativeStorage.getItem('mywallet')
          .then(async mywallet => {
            this.irohautil.wallet.mywallet = mywallet

            if (!this.irohautil.wallet.mywalletIsEncrypted) { // if wallet not encrypted then login
              await this.login()
                .then(() => this.irohautil.mywalletIsopen = true)
                .catch(() => {
                  loading_done = true
                  loading.dismiss()
                })
            }
          },
            _ => this.irohautil.wallet.mywallet = null
          )
      }

      loading_done = true
      loading.dismiss()
    })

  }

  // Start: For the select/change assets
  @ViewChild('selectAsset') selectAsset: IonSelect;

  async display_selectAsset() {
    // refresh assets and then open select assets
    await this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
      .then(assets => {
        this.irohautil.wallet.assets = assets
        if (assets.length == 0) this.irohautil.alert( this.translate.instant('COMMON.nowallet_available') )
        else this.selectAsset.open() // open up the html currency selection
      })
      .catch((err) => {
        this.irohautil.console_log("Error run_getAccountAssets: " + err)
        if (err.code == 2) this.irohautil.alert( this.translate.instant('COMMON.server_issue') )
      })

  }

  async selectAsset_ionChange($event) {

    if (this.irohautil.wallet.cur_assetId !== $event.detail.value.assetId) {

      this.irohautil.wallet.cur_assetId = $event.detail.value.assetId
      //this.irohautil.wallet.cur_assetId_decimal = ($event.detail.value.balance.length - 1) - $event.detail.value.balance.indexOf('.')
      await this.irohautil.run_getAssetInfo($event.detail.value.assetId)
        .then((assetId) => {
          this.irohautil.wallet.cur_assetId_decimal = assetId.precision
        })
        .catch(err => this.irohautil.console_log(err))

      this.nativeStorage.setItem('cur_assetId', this.irohautil.wallet.cur_assetId)
        .catch(err => this.irohautil.console_log("Error storing cur_assetId: " + JSON.stringify(err)))

    }
  }
  // End: For the select/change assets

  async newwallet(form: NgForm) {

    if (form.valid) {

      if (this.myprk_restore.length > 0) {  // restore wallet

        let loading_done = false
        const loading = await this.loadingController.create({
          message: this.translate.instant('WALLET.wallet_restoring'),
          translucent: true,
          spinner: 'lines',
          duration: this.irohautil.loadingController_timeout
        })
        loading.onDidDismiss().then(() => {
          if (!loading_done) this.irohautil.alert( this.translate.instant('COMMON.timeout') )
        })
        loading.present().then(async () => {

          await this.irohautil.login_restore(this.irohautil.wallet.mywallet, this.myprk_restore)
            .then(async () => {
              let wal; let prk; let puk

              this.irohautil.wallet.mypuk = derivePublicKey(Buffer.from(this.myprk_restore, 'hex')).toString('hex')
              this.irohautil.wallet.myprk = this.myprk_restore
              this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet


              if (this.mywalletpw_input.length > 0) {
                this.irohautil.wallet.mywalletIsEncrypted = true // new encrypted wallet with password

                wal = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.mywallet, this.mywalletpw_input)
                puk = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.mypuk, this.mywalletpw_input)
                prk = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.myprk, this.mywalletpw_input)

              } else { // do not encrypt
                this.irohautil.wallet.mywalletIsEncrypted = false // wallet with NO encryption

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

              this.login() // to reload data
                .catch(err => this.irohautil.console_log(err))

              this.irohautil.mywalletIsopen = true
              this.irohautil.alert( this.translate.instant('WALLET.restore_wallet_ok') )

              // clean for next remove wallet
              this.myprk_restore = ''
              this.myprk_restore_min = 0
              this.mywallet_restore_button = this.translate.instant('WALLET.new')
            })
            .catch(err => {
              this.irohautil.console_log(err)
              this.irohautil.alert( this.translate.instant('WALLET.restore_wallet_failed') )
            })

          loading_done = true
          loading.dismiss()
        })

      } else { // new wallet

        let loading_done = false
        const loading = await this.loadingController.create({
          message: this.translate.instant('WALLET.creating_wallet'),
          translucent: true,
          spinner: 'lines',
          duration: this.irohautil.loadingController_timeout
        })
        loading.onDidDismiss().then(() => {
          if (!loading_done) this.irohautil.alert( this.translate.instant('COMMON.timeout') )
        })
        loading.present().then(async () => {

          await this.irohautil.login_na() // login with na to create account
            .then(async () => {

              await this.irohautil.generateKeypair()
                .then(async ({ publicKey, privateKey }) => {

                  await this.irohautil.run_createAccount(this.irohautil.wallet.mywallet, publicKey)
                    .then(async () => {
                      let wal; let prk; let puk

                      this.irohautil.wallet.mypuk = publicKey
                      this.irohautil.wallet.myprk = privateKey
                      this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet

                      if (this.mywalletpw_input.length > 0) {
                        this.irohautil.wallet.mywalletIsEncrypted = true // new encrypted wallet with password

                        wal = await this.irohautil.encrypt_mywallet(this.irohautil.wallet.mywallet, this.mywalletpw_input)
                        puk = await this.irohautil.encrypt_mywallet(publicKey, this.mywalletpw_input)
                        prk = await this.irohautil.encrypt_mywallet(privateKey, this.mywalletpw_input)

                      } else { // do not encrypt
                        this.irohautil.wallet.mywalletIsEncrypted = false // wallet with NO encryption

                        wal = this.irohautil.wallet.mywallet
                        puk = publicKey
                        prk = privateKey
                      }

                      this.nativeStorage.setItem('mywalletIsEncrypted', this.irohautil.wallet.mywalletIsEncrypted)
                        .catch(err => this.irohautil.console_log("Error storing mywalletIsEncrypted: " + JSON.stringify(err)));

                      this.nativeStorage.setItem('mywallet', wal)
                        .catch(err => this.irohautil.console_log("Error storing mywallet: " + JSON.stringify(err)));

                      this.nativeStorage.setItem('mypuk', puk)
                        .catch(err => this.irohautil.console_log("Error storing mypuk: " + JSON.stringify(err)));

                      this.nativeStorage.setItem('myprk', prk)
                        .catch(err => this.irohautil.console_log("Error storing myprk: " + JSON.stringify(err)));

                      await this.login() // to reload data
                        .catch(err => this.irohautil.console_log(err))

                      this.irohautil.mywalletIsopen = true

                      this.irohautil.alert( this.translate.instant('WALLET.create_wallet_ok') )
                    })
                    .catch(err => {
                      this.irohautil.console_log(JSON.stringify(err))

                      if (err.includes("expected=COMMITTED, actual=STATEFUL_VALIDATION_FAILED"))
                           this.irohautil.alert( this.translate.instant('WALLET.wallet_already_exists') )
                      else this.irohautil.alert( this.translate.instant('WALLET.create_wallet_failed') )
                    })
                })
                .catch(err => {
                  this.irohautil.console_log(err)
                  this.irohautil.alert( this.translate.instant('WALLET.create_wallet_failed') )
                })

            })
            .catch(err => {
              this.irohautil.console_log(err)
              this.irohautil.alert( this.translate.instant('WALLET.create_wallet_failed') +'\n' + this.translate.instant('COMMON.server_issue') )
            })

          loading_done = true
          loading.dismiss()
        })
      }
    }

  }

  mywallet_restore_change() {
    if (this.myprk_restore.length > 0) {
      this.myprk_restore_min = this.myprk_restore_min = 64
      this.mywallet_restore_button = this.translate.instant('WALLET.restore')
    } else {
      this.myprk_restore_min = this.myprk_restore_min = 0
      this.mywallet_restore_button = this.translate.instant('WALLET.new')
    }
  }

  scanCode_mywallet() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //this.irohautil.console_log("Barcode data " + JSON.stringify(barcodeData));
        this.irohautil.wallet.mywallet = barcodeData.text
      })
      .catch(err => {
        this.irohautil.console_log("Error scanCode_mywallet: " + err)
      });
  }

  scanCode_myprk() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //this.irohautil.console_log("Barcode data " + JSON.stringify(barcodeData));

        if (barcodeData.text.length == 64)
          this.myprk_restore = barcodeData.text
        else {
          this.myprk_restore = ''
          this.irohautil.alert( this.translate.instant('WALLET.invalid_code') )
        }

      })
      .catch(err => {
        this.irohautil.console_log("Error scanCode_mywallet: " + err);
      })
  }

  async login() {

    return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
      .catch((err) => {
        return Promise.reject(err)
      })

  }

  async mywalletpw_submit() {

    let loading_done = false
    const loading = await this.loadingController.create({
      message: this.translate.instant('WALLET.login'),
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout  // (autodismiss after n msecs)
    })
    loading.onDidDismiss().then(() => {
      if (!loading_done) this.irohautil.alert( this.translate.instant('COMMON.timeout') )
    })
    loading.present().then(async () => {

      let wal; let prk; let puk

      wal = await this.irohautil.decrypt_mywallet(this.irohautil.wallet.mywallet, this.mywalletpw_input)
      if (wal.length > 0) { // password is ok
        puk = await this.irohautil.decrypt_mywallet(this.irohautil.wallet.mypuk, this.mywalletpw_input)
        prk = await this.irohautil.decrypt_mywallet(this.irohautil.wallet.myprk, this.mywalletpw_input)

        await this.irohautil.login_restore(wal, prk)
          .then(async () => {
            this.irohautil.wallet.mywallet = wal
            this.irohautil.wallet.mypuk = puk
            this.irohautil.wallet.myprk = prk
            this.irohautil.wallet.mywalletIsEncrypted = true
            this.mywalletpw_input = '' // clear password
            this.mywalletpw_input2 = '' // clear password
            await this.login()
              .then(() => {
                this.irohautil.mywalletIsopen = true
              })
              .catch(err => this.irohautil.console_log(err))
          })
          .catch(err => {
            this.irohautil.console_log("home.page.mywalletpw_submit - " + err)
          })

      } else this.irohautil.alert( this.translate.instant('WALLET.wrong_password') )

      loading_done = true
      loading.dismiss()
    })

  }

  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';
  hideShowPassword() {
    this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
    this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }

  passwordType2: string = 'password';
  passwordIcon2: string = 'eye-off';
  hideShowPassword2() {
    this.passwordType2 = this.passwordType2 === 'text' ? 'password' : 'text';
    this.passwordIcon2 = this.passwordIcon2 === 'eye-off' ? 'eye' : 'eye-off';
  }

  mywalletpws_ionchange() {

    if (
      this.mywalletpw_input.length == 0 &&
      this.mywalletpw_input2.length == 0
    )
      this.mywalletpws_ok = true
    else if (
      this.mywalletpw_input.length > this.irohautil.password_min_len_gt &&
      this.mywalletpw_input == this.mywalletpw_input2
    )
      this.mywalletpws_ok = true
    else
      this.mywalletpws_ok = false

  }


}