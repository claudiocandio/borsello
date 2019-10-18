import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSelect, LoadingController } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { TranslateService } from '@ngx-translate/core';

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
    public loadingController: LoadingController,
    private translate: TranslateService
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
      this.get_transactions_list()

      //this.irohautil.wallet.cur_assetId_decimal = ($event.detail.value.balance.length - 1) - $event.detail.value.balance.indexOf('.')
      await this.irohautil.run_getAssetInfo($event.detail.value.assetId)
        .then((assetId) => {
          this.irohautil.wallet.cur_assetId_decimal = assetId.precision
        })
        .catch(err => this.irohautil.console_log(err))

      this.nativeStorage.setItem('cur_assetId', this.irohautil.wallet.cur_assetId)
        .catch(err => this.irohautil.console_log("Error storing cur_assetId: " + JSON.stringify(err)));
    }

  }
  // End: For the select/change assets

  async get_transactions_list() {

    let loading_done = false
    const loading = await this.loadingController.create({
      message: this.translate.instant('TXS.reading_txs'),
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout
    })
    loading.onDidDismiss().then(() => {
      if (!loading_done) this.irohautil.alert( this.translate.instant('COMMON.timeout') )
    })
    loading.present().then(() => {

      this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
        .then(() => {

          this.txs = []  // empty any previous transaction

          this.irohautil.run_getAccountAssetTransactions(this.irohautil.wallet.mywallet, this.irohautil.wallet.cur_assetId)
            .then(transactions => {
              //this.irohautil.console_log(JSON.stringify(transactions))
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
                    from: srcAccountId.split('@')[0],
                    to: destAccountId.split('@')[0],
                    amount: amount,
                    date: createdTime,
                    currency: assetId.split('#')[0],
                    puk: t.signaturesList[0].publicKey,
                    message: description
                  }
                  this.txs.push(tx)

                })

              });
              this.txs = _.orderBy(this.txs, [object => new moment(object.date)], ['desc']);
            })
            .catch(err => {
              if (err.code == 2) this.irohautil.alert(this.translate.instant('COMMON.server_issue') )
              this.irohautil.console_log(JSON.stringify(err))
            })
        })
        .catch((err) => {
          this.irohautil.console_log("Error get_transactions_list login: " + err)
        })

      loading_done = true
      loading.dismiss()
    })

  }

}
