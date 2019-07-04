
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

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

  public lines: Array<{ str: string; }> = [];

  constructor(private nativeStorage: NativeStorage,
              private barcodeScanner: BarcodeScanner,
              public alertController: AlertController
              ) {
  }

  ngOnInit() {
/*
    this.nativeStorage.setItem('myitem', {property: 'value', anotherProperty: 'anotherValue'})
    .then(
      () => alert('Stored item!'),
      error => alert('Error storing item:'+ error)
    );
*/

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
    //alert(this.wallet.mywallet)

    function generateKeypair() {
      const iroha = require('iroha-lib') // npm install iroha-lib
      const crypto = new iroha.ModelCrypto()
      const keypair = crypto.generateKeypair()
      const publicKey = keypair.publicKey().hex()
      const privateKey = keypair.privateKey().hex()

      return { publicKey, privateKey }
    }

    if (form.valid) {

      this.nativeStorage.getItem('mypuk').then(_ => alert('Keys already exists: ' + this.wallet.mypuk))
      .catch(() => { /* keys not created yet */

        const { publicKey, privateKey } = generateKeypair()
        //alert('New keys\npuk: ' + publicKey + '\nprk: ' + privateKey)
        this.wallet.mypuk = publicKey
        this.wallet.myprk = privateKey

        this.nativeStorage.setItem('mywallet', this.wallet.mywallet)
        .catch(err => alert("Error storing mywallet: " + JSON.stringify(err)));

        this.nativeStorage.setItem('mypuk', publicKey)
        .catch(err => alert("Error storing mypuk: " + JSON.stringify(err)));

        this.nativeStorage.setItem('myprk', privateKey)
        .catch(err => alert("Error storing myprk: " + JSON.stringify(err)));

      });

    }
    /*
      for (let i = 1; i < 11; i++) {
        this.lines.push({
          str: 'Line ' + i
        });
      }
      */


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

}

