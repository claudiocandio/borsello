import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect, AlertController, LoadingController } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { NgForm } from '@angular/forms';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';

import { IrohautilService, WalletDataTo } from '../../services/irohautil.service'

@Component({
  selector: 'app-send',
  templateUrl: './send.page.html',
  styleUrls: ['./send.page.scss'],
})

export class SendPage implements OnInit {

  public walletTo: WalletDataTo = {
    wallet: '',
    amount: '',
    message: ''
  }

  constructor(
    private barcodeScanner: BarcodeScanner,
    public irohautil: IrohautilService,
    private nativeStorage: NativeStorage,
    private alertController: AlertController,
    public loadingController: LoadingController
  ) {

    this.barcodeScannerOptions = {
      showTorchButton: true,
      showFlipCameraButton: true
    }

  }

  barcodeScannerOptions: BarcodeScannerOptions;

  ngOnInit() {
  }

  // Start: For the select/change assets
  @ViewChild('selectAsset') selectAsset: IonSelect;

  async display_selectAsset() {
    // refresh assets and then open select assets
    await this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
      .then(assets => {
        this.irohautil.wallet.assets = assets
        if(assets.length == 0) alert("Nessun Wallet/Valuta disponibile")
        else this.selectAsset.open() // open up the html currency selecttion
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


  async walletSendTo_confirm(form: NgForm) {
    const alert = await this.alertController.create({
      header: 'Conferma Invio',
      //message: '',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Invio',
          handler: () => {
            this.walletSendTo(form)
          }
        }
      ]
    });
    await alert.present();
  }
  async walletSendTo(form: NgForm) {

    if (form.valid) {

      const loading = await this.loadingController.create({
        message: 'Invio in corso...',
        translucent: true,
        spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
        //duration: 5000   (autodismiss after 5 secs)
      })
      loading.present().then(async () => {

      await this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet) // check if enough balance
        .then(async assets => {
          this.irohautil.wallet.assets = assets
          let cur_balance = this.irohautil.wallet.assets.find(a => a.assetId == this.irohautil.wallet.cur_assetId).balance

          if (Number(this.walletTo.amount) > Number(cur_balance)) { // NOT enough balance
            console.log("this.walletTo.amount: "+this.walletTo.amount)
            console.log("cur_balance: "+cur_balance)
            alert("Invio fallito!\nErrore: Valuta totale non sufficente")
          } else { // ok there is enough balance

            if (!this.walletTo.wallet.includes("@")) // if no domainId add it
              this.walletTo.wallet = this.walletTo.wallet + '@' + this.irohautil.domainId

            await this.irohautil.run_transferAsset(this.walletTo.wallet, this.walletTo.amount, this.walletTo.message)
              .then(() => {
                this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
                  .then(assets => {
                    this.irohautil.wallet.assets = assets
                    //this.selectAsset.open() // open up the html currency selecttion
                  })
                  .catch(err => console.log(err))

                alert("Invio completato con successo")
              })
              .catch(err => {

                if (err.includes("expected=COMMITTED, actual=STATEFUL_VALIDATION_FAILED"))
                  alert("Invio fallito!\nErrore: Indirizzo Wallet non esistente.")
                else alert("Invio fallito!\nProblemi di connessione al Server")
                console.log("Error run_transferAsset: " + JSON.stringify(err))
              })

          }
        })
        .catch((err) => { // error geting cur_balance
          if (err.code == 2) alert("Problemi di connessione al Server")
          console.log("Error run_getAccountAssets: " + JSON.stringify(err))
        })

        loading.dismiss();
      })


    }



  }

  scanCode_wallet() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //console.log("Barcode data " + JSON.stringify(barcodeData));
        this.walletTo.wallet = barcodeData.text

      })
      .catch(err => {
        console.log("Error scanCode_mywallet: ", err);
      })
  }

}
