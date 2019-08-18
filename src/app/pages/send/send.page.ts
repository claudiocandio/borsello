import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect } from '@ionic/angular';
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
    private nativeStorage: NativeStorage
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



  walletSendTo(form: NgForm) {

    if (form.valid) {

      //this.isSending = true
      this.irohautil.run_transferAsset(this.walletTo.wallet+'@iroha', this.walletTo.amount, this.walletTo.message)
        .then(ok => {
          console.log("OK: "+ok)
        })
        .catch(err => console.log(err))
      //.finally(() => { this.isSending = false })



    }
  }


}
