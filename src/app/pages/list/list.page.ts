import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect, LoadingController } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { IrohautilService } from '../../services/irohautil.service'
import * as _ from 'lodash';
var moment = require('moment');

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss']
})

export class ListPage implements OnInit {

  public txs: Array<{
    from: string; to: string; amount: string; date: string; currency: string; puk: string; message: string;
  }> = [];

  constructor(
    public irohautil: IrohautilService,
    private nativeStorage: NativeStorage,
    public loadingController: LoadingController
  ) {

    if (this.irohautil.wallet.cur_assetId !== null) this.get_transactions_list()

  }

  ngOnInit() {
  }

  // Start: For the select/change assets
  @ViewChild('selectAsset') selectAsset: IonSelect;

  async display_selectAsset() {
    // refresh assets and then open select assets
    await this.irohautil.run_getAccountAssets(this.irohautil.wallet.mywallet)
      .then(assets => {
        this.irohautil.wallet.assets = assets
        if(assets.length == 0) this.irohautil.alert("Nessun Wallet/Valuta disponibile")
        else this.selectAsset.open() // open up the html currency selecttion
      })
      .catch((err) => {
        console.log("Error run_getAccountAssets: " + err)
        if (err.code == 2) this.irohautil.alert("Problemi di connessione al Server")
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
      .catch(err => this.irohautil.alert("Error storing cur_assetId: " + JSON.stringify(err)));
  }
  // End: For the select/change assets

  async get_transactions_list() {

    const loading = await this.loadingController.create({
      message: 'Lettura transazioni in corso...',
      translucent: true,
      spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
      //duration: 5000   (autodismiss after 5 secs)
    })
    loading.present().then(() => {

      this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
        .then(() => {

          this.txs = []  // empty any previous transaction

          this.irohautil.run_getAccountAssetTransactions(this.irohautil.wallet.mywallet, this.irohautil.wallet.cur_assetId)
            .then(transactions => {
              //console.log(JSON.stringify(transactions))
              if (transactions.isEmpty) return []
              //transactions.nextTxHash !!!!!!!!!!!!!!!!!!!

              transactions.transactionsList.forEach(t => {
                const { commandsList, createdTime } = t.payload.reducedPayload

                commandsList.forEach(c => {
                  if (!c.transferAsset) return
                  const {
                    amount,
                    assetId,
                    destAccountId,
                    srcAccountId,
                    description
                  } = c.transferAsset

                  const tx = {
                    /*
                    from: srcAccountId === this.irohautil.wallet.mywallet ? 'you' : srcAccountId,
                    to: destAccountId === this.irohautil.wallet.mywallet ? 'you' : destAccountId,
                    */
                    from: srcAccountId,
                    to: destAccountId,
                    amount: amount,
                    date: createdTime,
                    currency: assetId,
                    puk: t.signaturesList[0].publicKey,
                    message: description
                  }
                  this.txs.push(tx)

                })

              });
              this.txs = _.orderBy(this.txs, [object => new moment(object.date)], ['desc']);
            })
            .catch(err => {
              if (err.code == 2) this.irohautil.alert("Problemi di connessione al Server")
              console.log(JSON.stringify(err))
            })
        })
        .catch((err) => {
          console.log("Error get_transactions_list login: " + err)
        })
      
        loading.dismiss();
    })

  }

}
