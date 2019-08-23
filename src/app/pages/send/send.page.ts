import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect, AlertController, LoadingController } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { NgForm } from '@angular/forms';
import { BarcodeScanner, BarcodeScannerOptions} from '@ionic-native/barcode-scanner/ngx';

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

  display_selectAsset() {
    // refresh assets and then open select assets
    this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
      .then(assets => {
        this.irohautil.wallet.assets = assets
        this.selectAsset.open() // open up the html currency selecttion
      })
      .catch(err => console.log(err))

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
  walletSendTo(form: NgForm) {

    if (form.valid) {

      // check if enough balance
      this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
        .then(assets => {
          this.irohautil.wallet.assets = assets
          let cur_balance = this.irohautil.wallet.assets.find(a => a.assetId == this.irohautil.wallet.cur_assetId).balance
          
          if (this.walletTo.amount > cur_balance) { // NOT enough balance
            alert("Invio fallito!\nErrore: Valuta totale non sufficente")
          }else{ // ok there is enough balance

            if (!this.walletTo.wallet.includes("@")) // if no domainId add it
              this.walletTo.wallet = this.walletTo.wallet + '@' + this.irohautil.domainId

            const loading = this.loadingController.create({
              message: 'Invio in corso...',
              spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
              //duration: 5000   (autodismiss after 5 secs)
            })
              .then((lc) => {
                lc.present()
                lc.onDidDismiss().then((dis) => {
                  //console.log('Loading dismissed!');
                });
              })

            this.irohautil.run_transferAsset(this.walletTo.wallet, this.walletTo.amount, this.walletTo.message)
              .then(() => {
                this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
                  .then(assets => {
                    this.irohautil.wallet.assets = assets
                    //this.selectAsset.open() // open up the html currency selecttion
                  })
                  .catch(err => console.log(err))

                this.loadingController.dismiss()

                alert("Invio completato con successo")
              })
              .catch(err => {
                this.loadingController.dismiss()


                if (err.includes("expected=COMMITTED, actual=STATEFUL_VALIDATION_FAILED"))
                  alert("Invio fallito!\nErrore: Indirizzo Wallet non esistente.")
                else alert("Invio fallito!\nPossibili problemi con il Server")
                console.log(err)
              })

          }
        })
        .catch(err => { // error geting cur_balance
          console.log(err)
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
