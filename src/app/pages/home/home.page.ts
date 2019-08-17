
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertController, IonSelect } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

import { IrohautilService } from '../../services/irohautil.service'

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  constructor(private nativeStorage: NativeStorage,
    private barcodeScanner: BarcodeScanner,
    private alertController: AlertController,
    public irohautil: IrohautilService
  ) {
  }

  ngOnInit() {

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
      .then(mywallet => {
        this.irohautil.wallet.mywallet = mywallet
        this.login()
        .catch(err => console.log(err))
      },
        _ => this.irohautil.wallet.mywallet = null
      )

  }

  // Start: For the select/change assets
  @ViewChild('selectAsset') selectAsset: IonSelect;
  display_selectAsset() {
    // refresh assets and then open select assets
    this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
      .then(assets => {
        this.irohautil.wallet.assets = assets
        this.selectAsset.open()
      })
      .catch(err => console.log(err))

  }
  selectAsset_ionChange($event) {
    this.irohautil.wallet.cur_assetId = $event.detail.value
    this.nativeStorage.setItem('cur_assetId', this.irohautil.wallet.cur_assetId)
      .catch(err => alert("Error storing cur_assetId: " + JSON.stringify(err)));
  }
  // End: For the select/change assets

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
  rmkeys() {

    this.nativeStorage.remove('mywallet').then(
      _ => this.irohautil.wallet.mywallet = null,
      err => alert("Error rm mywallet: " + JSON.stringify(err))
    )

    this.nativeStorage.remove('myprk').then(
      _ => this.irohautil.wallet.mywallet = null,
      err => alert("Error rm myprk: " + JSON.stringify(err))
    )

    this.nativeStorage.remove('mypuk').then(_ => {
      _ => this.irohautil.wallet.mywallet = null
      window.location.reload()
    }).catch(err => alert("Error rm mywallet: " + JSON.stringify(err)))

    this.nativeStorage.remove('cur_assetId').then(_ => {
      _ => this.irohautil.wallet.cur_assetId = null
      window.location.reload()
    }).catch(err => alert("Error rm cur_assetId: " + JSON.stringify(err)))

  }

  newwallet(form: NgForm) {

    function generateKeypair() {
      const iroha = require('iroha-lib') // npm install iroha-lib
      const crypto = new iroha.ModelCrypto()
      const keypair = crypto.generateKeypair()
      const publicKey = keypair.publicKey().hex()
      const privateKey = keypair.privateKey().hex()

      //    return { publicKey, privateKey }
      //    Force pub/priv keys of alice@iroha !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      return {
        publicKey: 'bcc4ab167ae7db371672170ed31e382f7c612fbfe918f99c276cd9dc199446a4',
        privateKey: '9c430dfe8c54b0a447e25f75121119ac3b649c1253bce8420f245e4c104dccd1'
      }
    }

    if (form.valid) {

      this.nativeStorage.getItem('mypuk').then(_ => alert('Wallet already exists: ' + this.irohautil.wallet.mypuk))
        .catch(() => { /* keys not created yet */

          const { publicKey, privateKey } = generateKeypair()
          //alert('New keys\npuk: ' + publicKey + '\nprk: ' + privateKey)
          this.irohautil.wallet.mypuk = publicKey
          this.irohautil.wallet.myprk = privateKey

          // Add domain iroha
          this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet + '@iroha'

          this.nativeStorage.setItem('mywallet', this.irohautil.wallet.mywallet)
            .catch(err => alert("Error storing mywallet: " + JSON.stringify(err)));

          this.nativeStorage.setItem('mypuk', publicKey)
            .catch(err => alert("Error storing mypuk: " + JSON.stringify(err)));

          this.nativeStorage.setItem('myprk', privateKey)
            .catch(err => alert("Error storing myprk: " + JSON.stringify(err)));

          this.login()
          .catch(err => console.log(err))

        });

    }

  }

  showqrcode_puk() {
    this.irohautil.wallet.mypuk_barcode = null

    if (this.irohautil.wallet.mypuk) {
      this.barcodeScanner.encode(this.barcodeScanner.Encode.TEXT_TYPE, this.irohautil.wallet.mypuk)
        .then((mypuk_barcode) => {
          this.irohautil.wallet.mypuk_barcode = mypuk_barcode
        })
        .catch(err => alert("Error: " + JSON.stringify(err)))
    }
  }
  showqrcode_prk() {
    this.irohautil.wallet.myprk_barcode = null

    if (this.irohautil.wallet.myprk) {
      this.barcodeScanner.encode(this.barcodeScanner.Encode.TEXT_TYPE, this.irohautil.wallet.myprk)
        .then((myprk_barcode) => {
          this.irohautil.wallet.mypuk_barcode = myprk_barcode
        })
        .catch(err => alert("Error: " + JSON.stringify(err)))
    }
  }

  login() {

    return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
      .then(ok => {
      this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
        .then(assets => {
          this.irohautil.wallet.assets = assets
          return Promise.resolve()
        })
        .catch(err =>{
          console.log(err)
          return Promise.reject(err)
        }) 
      })
      .catch(err =>{
        console.log(err)
        return Promise.reject(err)
      }) 

  }

}