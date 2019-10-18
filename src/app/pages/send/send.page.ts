import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect, AlertController, LoadingController } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { NgForm } from '@angular/forms';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';
import { TranslateService } from '@ngx-translate/core';

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
    public loadingController: LoadingController,
    private translate: TranslateService
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
        if (assets.length == 0) this.irohautil.alert( this.translate.instant('COMMON.nowallet_available') )
        else this.selectAsset.open() // open up the html currency selecttion
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


  async walletSendTo_confirm(form: NgForm) {
    const alert = await this.alertController.create({
      header: this.translate.instant('COMMON.confirm'),
      //message: '',
      buttons: [
        {
          text: this.translate.instant('COMMON.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: this.translate.instant('SEND.tab'),
          handler: () => {
            this.walletSendTo(form)
          }
        }
      ]
    });
    await alert.present();
  }

  async walletSendTo(form: NgForm) {

    if (this.irohautil.wallet.mywallet == this.walletTo.wallet)
      this.irohautil.alert( this.translate.instant('SEND.send_itself_not_possible') )

    else if (form.valid) {

      let loading_done = false
      const loading = await this.loadingController.create({
        message: this.translate.instant('SEND.sending'),
        translucent: true,
        spinner: 'lines',
        duration: this.irohautil.loadingController_timeout
      })
      loading.onDidDismiss().then(() => {
        if (!loading_done) this.irohautil.alert( this.translate.instant('SEND.timeout') )
      })
      loading.present().then(async () => {

        await this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet) // check if enough balance
          .then(async assets => {
            this.irohautil.wallet.assets = assets
            let cur_balance = this.irohautil.wallet.assets.find(a => a.assetId == this.irohautil.wallet.cur_assetId).balance

            if (Number(this.walletTo.amount) > Number(cur_balance)) { // NOT enough balance

              this.irohautil.console_log("this.walletTo.amount: " + this.walletTo.amount)
              this.irohautil.console_log("cur_balance: " + cur_balance)
              this.irohautil.alert( this.translate.instant('SEND.send_failed') + '\n' + this.translate.instant('SEND.no_enough_amount') )

            } else if (Number(this.walletTo.amount) == 0) {

              this.irohautil.alert( this.translate.instant('SEND.sending_zero') )
              
            } else { // ok there is enough balance amd amount > 0

              // conver amount to string to not get error from iroha transferAsset function
              this.walletTo.amount = this.walletTo.amount.toString()

              await this.irohautil.run_transferAsset(this.walletTo.wallet, this.walletTo.amount, this.walletTo.message)
                .then(() => {
                  this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
                    .then(assets => {
                      this.irohautil.wallet.assets = assets
                      //this.selectAsset.open() // open up the html currency selecttion
                    })
                    .catch(err => this.irohautil.console_log(err))

                  this.irohautil.alert( this.translate.instant('SEND.send_completed') )
                })
                .catch(err => {
                  this.irohautil.console_log('send.page.walletSendTo.run_transferAsset - ' + err)
                  if (err.includes("expected=COMMITTED, actual=STATEFUL_VALIDATION_FAILED"))
                    this.irohautil.alert(this.translate.instant('SEND.send_failed') + '\n' + this.translate.instant('SEND.wallet_not_exists') )
                  else this.irohautil.alert(this.translate.instant('SEND.send_failed') + '\n' + this.translate.instant('COMMON.server_issue'))
                  this.irohautil.console_log("Error run_transferAsset: " + JSON.stringify(err))
                })

            }
          })
          .catch((err) => { // error geting cur_balance
            if (err.code == 2) this.irohautil.alert( this.translate.instant('COMMON.server_issue') )
            this.irohautil.console_log("Error run_getAccountAssets: " + JSON.stringify(err))
          })

        loading_done = true
        loading.dismiss()
      })


    }

  }

  scanCode_wallet() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //this.irohautil.console_log("Barcode data " + JSON.stringify(barcodeData));
        this.walletTo.wallet = barcodeData.text

      })
      .catch(err => {
        this.irohautil.console_log("Error scanCode_mywallet: " + err);
      })
  }

}
