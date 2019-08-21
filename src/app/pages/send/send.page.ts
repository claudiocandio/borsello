import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect, AlertController, LoadingController } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { NgForm } from '@angular/forms';

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
    public irohautil: IrohautilService,
    private nativeStorage: NativeStorage,
    private alertController: AlertController,
    public loadingController: LoadingController
  ) { }

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
    this.irohautil.wallet.cur_assetId_decimal = ($event.detail.value.balance.length - 1) - $event.detail.value.balance.indexOf('.')
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
      const loading = this.loadingController.create({
        message: 'Invio in corso...',
        spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
        //duration: 5000   (autodismiss after 5 secs)
      })
      .then((lc) => {
        lc.present()
        lc.onDidDismiss().then((dis) => {
          console.log('Loading dismissed!');
        });
      }) 

      this.irohautil.run_transferAsset(this.walletTo.wallet, this.walletTo.amount, this.walletTo.message)
        .then(() => {
          this.loadingController.dismiss()
          alert("Invio completato con successo")
        })
        .catch(err => {
          this.loadingController.dismiss()
          alert("Errore: Invio fallito")
          console.log(err)
        })

    }
  }


}
