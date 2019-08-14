import { Component, OnInit } from '@angular/core';
import { IrohautilService } from '../../services/irohautil.service'
import * as _ from 'lodash';
var moment = require('moment');

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss']
})
export class ListPage implements OnInit {
  public txs: Array<{ from: string; to: string; amount: string; date: string; currency: string; message: string; }> = [];

  constructor(public irohautil: IrohautilService) {

    this.irohautil.run_getAccountAssetTransactions(this.irohautil.wallet.mywallet, 'sesterzio#iroha')
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
              from: srcAccountId === this.irohautil.wallet.mywallet ? 'you' : srcAccountId,
              to: destAccountId === this.irohautil.wallet.mywallet ? 'you' : destAccountId,
              amount: amount,
              date: createdTime,
              currency: assetId,
              message: description
            }
            this.txs.push(tx)

          })
          /*
            console.log(transactions.payload.reducedPayload.commandsList[0].transferAsset.srcAccountId)
            console.log(transactions.payload.reducedPayload.commandsList[0].transferAsset.destAccountId)
            console.log(transactions.payload.reducedPayload.commandsList[0].transferAsset.assetId)
            console.log(transactions.payload.reducedPayload.commandsList[0].transferAsset.amount)
            console.log(new Date(transactions.payload.reducedPayload.createdTime).toLocaleString())
            console.log("-------------------------------")
            */
        });
        this.txs = _.orderBy(this.txs, [object => new moment(object.date)], ['desc']);
      })
      .catch(err => alert(err))

  }

  ngOnInit() {
  }
  // add back when alpha.4 is out
  // navigate(item) {
  //   this.router.navigate(['/list', JSON.stringify(item)]);
  // }
}
