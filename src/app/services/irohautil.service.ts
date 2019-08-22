import * as iroha from 'iroha-lib'   // this has to be on top, otherwise it gives error TypeError: message.getMainPubkey_asU8 is not a function
const crypto = new iroha.ModelCrypto() // npm i iroha-lib

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
  cur_assetId_decimal: any;
}

export interface WalletDataTo {
  wallet: string;
  amount: string;
  message: string;
}

const nodeIp = 'http://192.168.0.2:8081'

@Injectable({
  providedIn: 'root'
})

export class IrohautilService {

  public domainId = 'mini'
  public wallet: WalletData = {
    mywallet: '',
    mypuk: null,
    myprk: null,
    mypuk_barcode: null,
    myprk_barcode: null,
    assets: null,
    cur_assetId: '',
    cur_assetId_decimal: null
  }
  // to run createAccount
  public naprk = '439c82fcb5f6ab7397c5f62cf7f9bd8b4284070514b6026725d160e873deb0d6'
  public na = 'na@'+this.domainId

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

  run_transferAsset(walletTo, amountTo, messageTo) {

    return irohaUtil.transferAsset(
      [this.wallet.myprk], 1,
      {
        srcAccountId: this.wallet.mywallet,
        destAccountId: walletTo,
        assetId: this.wallet.cur_assetId,
        description: messageTo,
        amount: amountTo
      })
      .then(() => {
        return Promise.resolve()
      })
      .catch(err => {
        return Promise.reject("Error transferAsset: " + err)
      })

  }

  run_createAccount(accountName, publicKey) {

    return irohaUtil.createAccount(
      [this.naprk], 1,
      {
        accountName: accountName,
        domainId: this.domainId,
        publicKey: publicKey
      })
      .then(() => {
        return Promise.resolve()
      })
      .catch(err => {
        return Promise.reject("Error createAccount: " + err)
      })

  }

  run_getAssetInfo(assetId) {

    return irohaUtil.getAssetInfo({
      assetId
    })
      .then(assetId => {
        return assetId
      })
      .catch(err => {
        return Promise.reject("Error getAssetInfo: " + err)
      })
  }
  
  async generateKeypair() {
    const keypair = crypto.generateKeypair()
    const publicKey = keypair.publicKey().hex()
    const privateKey = keypair.privateKey().hex()

    return { publicKey, privateKey }
  }


}
