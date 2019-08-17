import { Injectable } from '@angular/core';
import irohaUtil from '../../util/iroha/'

export interface WalletData {
  mywallet: string;
  mypuk: string;
  myprk: string;
  mypuk_barcode: any;
  myprk_barcode: any;
  assets: any;
  cur_assetId: string;
}

const nodeIp = 'http://192.168.0.2:8081'

@Injectable({
  providedIn: 'root'
})

export class IrohautilService {

  public wallet: WalletData = {
    mywallet: '',
    mypuk: null,
    myprk: null,
    mypuk_barcode: null,
    myprk_barcode: null,
    assets: null,
    cur_assetId: ''
  } 
  
  constructor() { }

  login(username, privateKey) {

    return irohaUtil.login(username, privateKey, nodeIp)
      .then(account => {
        return (JSON.stringify(account))
      })
      .catch(err => {
        return Promise.reject(err)
      })

  }

  run_getAccountAssetTransactions(username, assetId, firstTxHash = undefined, pageSize = 500) {
    // irohaUtil.getAccountTransactions({ .. no good as it onluìy returns trx done my me, not those from other to me

    return irohaUtil.getAccountAssetTransactions({
      accountId: username,
      assetId: assetId,
      pageSize: pageSize,
      firstTxHash: firstTxHash
    })
      .then(transactions => {
        return transactions
      })
      .catch(err => {
        return Promise.reject("Error getAccountAssetTransactions: " + err)
      })
  }

  run_getAccountAssets(username) {

    return irohaUtil.getAccountAssets({
      accountId: username
    })
      .then(transactions => {
        return transactions
      })
      .catch(err => {
        return Promise.reject("Error getAccountAssets: " + err)
      })
  }




}
