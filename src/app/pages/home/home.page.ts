
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
//import { IrohautilService } from '../../services/irohautil.service'

import * as grpc from 'grpc'

import {
  QueryService_v1Client,
  CommandService_v1Client
} from 'iroha-helpers/lib/proto/endpoint_grpc_pb'
import { commands, queries } from 'iroha-helpers'

const DEFAULT_TIMEOUT_LIMIT = 5000
//const nodeIp = 'http://192.168.0.2:9081'
const nodeIp = '192.168.0.2:50051'

const queryService = new QueryService_v1Client(
  nodeIp,
  grpc.credentials.createInsecure()
)

export interface WalletData {
  mywallet: string;
  mypuk: string;
  myprk: string;
  mypuk_barcode: any;
  myprk_barcode: any;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  public wallet: WalletData = {
    mywallet: '',
    mypuk: null,
    myprk: null,
    mypuk_barcode: null,
    myprk_barcode: null
  };

  constructor(private nativeStorage: NativeStorage,
    private barcodeScanner: BarcodeScanner,
    public alertController: AlertController
//    public irohautil: IrohautilService
  ) {
  }

  ngOnInit() {

    this.nativeStorage.getItem('mypuk').then(
      mypuk => this.wallet.mypuk = mypuk,
      _ => this.wallet.myprk = null
    );

    this.nativeStorage.getItem('myprk').then(
      myprk => this.wallet.myprk = myprk,
      _ => this.wallet.myprk = null
    );

    this.nativeStorage.getItem('mywallet').then(
      mywallet => this.wallet.mywallet = mywallet,
      _ => this.wallet.mywallet = null
    );

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


  rmkeys() {

    this.nativeStorage.remove('mywallet').then(
      _ => this.wallet.mywallet = null,
      err => alert("Error: " + JSON.stringify(err))
    )
    this.nativeStorage.remove('myprk').then(
      _ => this.wallet.mywallet = null,
      err => alert("Error: " + JSON.stringify(err))
    )
    this.nativeStorage.remove('mypuk').then(_ => {
      _ => this.wallet.mywallet = null
      window.location.reload()
    }).catch(err => alert("Error: " + JSON.stringify(err)))

  }

  newwallet(form: NgForm) {

    function generateKeypair() {
      const iroha = require('iroha-lib') // npm install iroha-lib
      const crypto = new iroha.ModelCrypto()
      const keypair = crypto.generateKeypair()
      const publicKey = keypair.publicKey().hex()
      const privateKey = keypair.privateKey().hex()

      //      return { publicKey, privateKey }
      //    Force pub/priv keys
      return {
        publicKey: 'bcc4ab167ae7db371672170ed31e382f7c612fbfe918f99c276cd9dc199446a4',
        privateKey: '9c430dfe8c54b0a447e25f75121119ac3b649c1253bce8420f245e4c104dccd1'
      }
    }

    if (form.valid) {

      this.nativeStorage.getItem('mypuk').then(_ => alert('Wallet already exists: ' + this.wallet.mypuk))
        .catch(() => { /* keys not created yet */

          const { publicKey, privateKey } = generateKeypair()
          //alert('New keys\npuk: ' + publicKey + '\nprk: ' + privateKey)
          this.wallet.mypuk = publicKey
          this.wallet.myprk = privateKey

          // Add domain iroha
          this.wallet.mywallet = this.wallet.mywallet + '@iroha'

          this.nativeStorage.setItem('mywallet', this.wallet.mywallet)
            .catch(err => alert("Error storing mywallet: " + JSON.stringify(err)));

          this.nativeStorage.setItem('mypuk', publicKey)
            .catch(err => alert("Error storing mypuk: " + JSON.stringify(err)));

          this.nativeStorage.setItem('myprk', privateKey)
            .catch(err => alert("Error storing myprk: " + JSON.stringify(err)));

        });

    }

  }

  showqrcode_puk() {
    this.wallet.mypuk_barcode = null

    if (this.wallet.mypuk) {
      this.barcodeScanner.encode(this.barcodeScanner.Encode.TEXT_TYPE, this.wallet.mypuk).then((mypuk_barcode) => {
        this.wallet.mypuk_barcode = mypuk_barcode
      }).catch(err => alert("Error: " + JSON.stringify(err)))
    }
  }
  showqrcode_prk() {
    this.wallet.myprk_barcode = null

    if (this.wallet.myprk) {
      this.barcodeScanner.encode(this.barcodeScanner.Encode.TEXT_TYPE, this.wallet.myprk).then((myprk_barcode) => {
        this.wallet.mypuk_barcode = myprk_barcode
      }).catch(err => alert("Error: " + JSON.stringify(err)))
    }
  }

  login() {
    if (this.wallet.myprk) {
/*
      this.irohautil.login(this.wallet.mywallet, this.wallet.myprk).then(account => {
        alert('Login OK: '+account)
      }).catch(err => alert("Login failed: " + JSON.stringify(err)))

      queries.getAccountDetail({
        privateKey: this.wallet.myprk,
        creatorAccountId: this.wallet.mywallet,
        queryService,
        timeoutLimit: DEFAULT_TIMEOUT_LIMIT
      }, {
          accountId: this.wallet.mywallet
        }).then(account => {
          alert('Login OK: '+account)
        }).catch(err => alert("Login failed: " + JSON.stringify(err)))
*/


    }
  }





}

