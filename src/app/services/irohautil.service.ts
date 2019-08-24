import * as iroha from 'iroha-lib'   // this has to be on top, otherwise it gives error TypeError: message.getMainPubkey_asU8 is not a function
const crypto = new iroha.ModelCrypto() // npm i iroha-lib

import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Injectable, OnInit } from '@angular/core';
import irohaUtil from '../../util/iroha/'

export interface WalletData {
  mywallet: string;
  mypuk: string;
  myprk: string;
  assets: any;
  cur_assetId: string;
  cur_assetId_decimal: any;
}

export interface WalletDataTo {
  wallet: string;
  amount: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})

//const nodeIp = 'http://192.168.0.2:8081'

export class IrohautilService {

  public domainId = 'mini'
  public wallet: WalletData = {
    mywallet: '',
    mypuk: null,
    myprk: null,
    assets: null,
    cur_assetId: '',
    cur_assetId_decimal: null
  }
  public nodeIp_default = 'http://192.168.0.2:8081'
  public nodeIp = ''

  // to run createAccount
  public naprk = '439c82fcb5f6ab7397c5f62cf7f9bd8b4284070514b6026725d160e873deb0d6'
  public na = 'na@' + this.domainId
  public qrcode_size = 200

  constructor(private nativeStorage: NativeStorage) {
  }

  login_na() {

    return irohaUtil.login(this.na, this.naprk, this.nodeIp)
      .then(() => {
        return Promise.resolve()
      })
      .catch(err => {
        console.log("Error login_na: " + JSON.stringify(err))
        alert("Problemi di connessione al Server")
        return Promise.reject(err)
      })
  }

  login(username, privateKey) {

    return irohaUtil.login(username, privateKey, this.nodeIp)
      .then(account => {

        this.run_getAccountAssets(this.wallet.mywallet)
          .then(assets => {
            this.wallet.assets = assets
            if (assets.length == 1) this.wallet.cur_assetId = assets[0].assetId

            this.run_getAssetInfo(this.wallet.cur_assetId)
              .then((assetId) => {
                this.wallet.cur_assetId_decimal = assetId.precision
              })
              .catch(err => {
                console.log("Error login run_getAssetInfo: " + err)
                //return Promise.reject(err)
              })
          })
          .catch(err => {
            console.log("Error login run_getAccountAssets: " + err)
            //return Promise.reject(err)
          })

        return Promise.resolve(account)
      })
      .catch(err => {
        //console.log("Error login: "+err)
        console.log("Error login: " + JSON.stringify(err))
        alert("Problemi di connessione al Server")
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
        console.log("Error run_getAccountAssetTransactions: " + err)
        console.log(JSON.stringify(err))
        return Promise.reject(err)
      })
  }

  run_getAccountAssets(username) {

    if (username)
      return irohaUtil.getAccountAssets({
        accountId: username
      })
        .then(transactions => {
          return transactions
        })
        .catch(err => {
          console.log("Error getAccountAssets: " + JSON.stringify(err))
          return Promise.reject(err)
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
