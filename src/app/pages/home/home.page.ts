import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonSelect, LoadingController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';

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
    public loadingController: LoadingController
  ) {
    this.barcodeScannerOptions = {
      showTorchButton: true,
      showFlipCameraButton: true
    };

  }
  private myprk_restore = ''
  public myprk_restore_min = 0
  public mywallet_restore_button = 'Crea Wallet'

  barcodeScannerOptions: BarcodeScannerOptions;

  ngOnInit() {

    if(this.irohautil.nodeIp_force){
      this.irohautil.nodeIp = this.irohautil.nodeIp_force

      this.nativeStorage.setItem('nodeIp', this.irohautil.nodeIp_force)
      .catch((err) => {
        console.log(JSON.stringify(err))
        alert("Error storing nodeIp: " + JSON.stringify(err));
      })

    }else
    this.nativeStorage.getItem('nodeIp').then(
      nodeIp => this.irohautil.nodeIp = nodeIp,
      _ => this.irohautil.nodeIp = this.irohautil.nodeIp_default
    )

    this.nativeStorage.getItem('mypuk').then(
      mypuk => this.irohautil.wallet.mypuk = mypuk,
      _ => this.irohautil.wallet.myprk = null
    )
    this.nativeStorage.getItem('myprk').then(
      myprk => this.irohautil.wallet.myprk = myprk,
      _ => this.irohautil.wallet.myprk = null
    )
    this.nativeStorage.getItem('cur_assetId').then(
      cur_assetId => this.irohautil.wallet.cur_assetId = cur_assetId,
      _ => this.irohautil.wallet.cur_assetId = null
    )
    this.nativeStorage.getItem('mywallet')
      .then(async mywallet => {
        this.irohautil.wallet.mywallet = mywallet

        await this.login()
          .catch(err => console.log(err))
      },
        _ => this.irohautil.wallet.mywallet = null
      )

  }

  // Start: For the select/change assets
  @ViewChild('selectAsset') selectAsset: IonSelect;

  async display_selectAsset() {
    // refresh assets and then open select assets
    await this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
      .then(assets => {
        this.irohautil.wallet.assets = assets
        this.selectAsset.open() // open up the html currency selecttion
      })
      .catch((err) => {
        console.log("Error run_getAccountAssets: " + err)
        if (err.code == 2) alert("Problemi di connessione al Server")
      })

  }

  selectAsset_ionChange($event) {
    this.irohautil.wallet.cur_assetId = $event.detail.value.assetId
    //this.irohautil.wallet.cur_assetId_decimal = ($event.detail.value.balance.length - 1) - $event.detail.value.balance.indexOf('.')
    this.irohautil.run_getAssetInfo($event.detail.value.assetId)
      .then((assetId) => {
        this.irohautil.wallet.cur_assetId_decimal = assetId.precision
      })
      .catch(err => console.log(err))

    this.nativeStorage.setItem('cur_assetId', this.irohautil.wallet.cur_assetId)
      .catch(err => alert("Error storing cur_assetId: " + JSON.stringify(err)));
  }
  // End: For the select/change assets

  async newwallet(form: NgForm) {


    if (form.valid) {

      this.nativeStorage.getItem('mypuk').then(_ => alert('Wallet already exists: ' + this.irohautil.wallet.mypuk))
        .catch(async () => { /* keys not created yet */

          if (this.myprk_restore.length > 0) {  // restore wallet

            const loading = await this.loadingController.create({
              message: 'Restore Wallet in corso...',
              translucent: true,
              spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
              //duration: 5000   (autodismiss after 5 secs)
            })
            loading.present().then(async () => {

              await this.irohautil.login_restore(this.irohautil.wallet.mywallet + '@' + this.irohautil.domainId, this.myprk_restore)
                .then(() => {

                  this.irohautil.wallet.mypuk = derivePublicKey(Buffer.from(this.myprk_restore, 'hex')).toString('hex')
                  this.irohautil.wallet.myprk = this.myprk_restore
                  this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet + '@' + this.irohautil.domainId

                  this.nativeStorage.setItem('mywallet', this.irohautil.wallet.mywallet)
                    .catch(err => alert("Error storing mywallet: " + JSON.stringify(err)));

                  this.nativeStorage.setItem('mypuk', this.irohautil.wallet.mypuk)
                    .catch(err => alert("Error storing mypuk: " + JSON.stringify(err)));

                  this.nativeStorage.setItem('myprk', this.myprk_restore)
                    .catch(err => alert("Error storing myprk: " + JSON.stringify(err)));

                  this.login() // to reload data
                    .catch(err => console.log(err))

                  alert("Restore Wallet completato con successo")

                  // clean for next remove wallet
                  this.myprk_restore = ''
                  this.myprk_restore_min = 0
                  this.mywallet_restore_button = 'Crea Wallet'
                })
                .catch(err => {
                  console.log(err)
                  alert("Restore Wallet fallito!")
                })

              loading.dismiss();
            })

          } else { // new wallet

            const loading = await this.loadingController.create({
              message: 'Creazione Wallet in corso...',
              translucent: true,
              spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
              //duration: 5000   (autodismiss after 5 secs)
            })
            loading.present().then(async () => {

            await this.irohautil.login_na() // login with na to create account
              .then(async () => {

                await this.irohautil.generateKeypair()
                  .then(async ({ publicKey, privateKey }) => {

                    await this.irohautil.run_createAccount(this.irohautil.wallet.mywallet, publicKey)
                      .then(() => {

                        this.irohautil.wallet.mypuk = publicKey
                        this.irohautil.wallet.myprk = privateKey
                        this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet + '@' + this.irohautil.domainId

                        this.nativeStorage.setItem('mywallet', this.irohautil.wallet.mywallet)
                          .catch(err => alert("Error storing mywallet: " + JSON.stringify(err)));

                        this.nativeStorage.setItem('mypuk', publicKey)
                          .catch(err => alert("Error storing mypuk: " + JSON.stringify(err)));

                        this.nativeStorage.setItem('myprk', privateKey)
                          .catch(err => alert("Error storing myprk: " + JSON.stringify(err)));

                        this.login() // to reload data
                          .catch(err => console.log(err))

                        alert("Wallet creato con successo")
                      })
                      .catch(err => {
                        console.log(err)

                        if (err.includes("expected=COMMITTED, actual=STATEFUL_VALIDATION_FAILED")) alert("Nome Wallet già presente!\n")
                        else alert("Creazione Wallet fallita!")
                      })
                  })
                  .catch(err => {
                    console.log(err)
                    alert("Creazione Wallet fallita!")
                  })

              })
              .catch(err => {
                console.log(err)
                alert("Creazione Wallet fallita!\nProblemi di connessione al Server.")
              })

              loading.dismiss()
            })
          }
        })
    }

  }

  mywallet_restore_change() {
    //console.log(this.myprk_restore)
    if (this.myprk_restore.length > 0) {
      this.myprk_restore_min = this.myprk_restore_min = 64
      this.mywallet_restore_button = 'Restore Wallet'
    } else {
      this.myprk_restore_min = this.myprk_restore_min = 0
      this.mywallet_restore_button = 'Crea Wallet'
    }
  }

  scanCode_mywallet() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //console.log("Barcode data " + JSON.stringify(barcodeData));

        if (barcodeData.text.includes('@' + this.irohautil.domainId)) // remove domainId when creating new wallet
          this.irohautil.wallet.mywallet = barcodeData.text.substring(0, barcodeData.text.indexOf('@' + this.irohautil.domainId))
        else if (barcodeData.text.includes('@')) {
          this.irohautil.wallet.mywallet = ''
          alert("Code invalido")
        } else this.irohautil.wallet.mywallet = barcodeData.text

      })
      .catch(err => {
        console.log("Error scanCode_mywallet: ", err)
      });
  }

  scanCode_myprk() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //console.log("Barcode data " + JSON.stringify(barcodeData));

        if (barcodeData.text.length == 64)
          this.myprk_restore = barcodeData.text
        else {
          this.myprk_restore = ''
          alert("Code invalido")
        }

      })
      .catch(err => {
        console.log("Error scanCode_mywallet: ", err);
      })
  }

  async login() {

    return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
      .catch((err) => {
        console.log("Error Home login: " + err)
        return Promise.reject(err)
      })

  }


}