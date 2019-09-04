import * as iroha from 'iroha-lib'   // this has to be on top, otherwise it gives error TypeError: message.getMainPubkey_asU8 is not a function
const crypto = new iroha.ModelCrypto() // npm i iroha-lib

import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Injectable } from '@angular/core';
import irohaUtil from '../../util/iroha/'
import { AES256 } from '@ionic-native/aes-256/ngx';
import { Platform, AlertController } from '@ionic/angular';
import SimpleCrypto from "simple-crypto-js";

export interface WalletData {
  mypw: boolean;
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

export class IrohautilService {
  public walcc_version = 'v1.0.3'
  public debug_console_log = true // whether to use console.log to debug

  public domainId = 'mini'
  public wallet: WalletData = {
    mypw: false,
    mywallet: '',
    mypuk: null,
    myprk: null,
    assets: null,
    cur_assetId: '',
    cur_assetId_decimal: null
  }

  //public nodeIp_force = 'http://maccarese.asuscomm.com:8081'
  public nodeIp_force = null // null to use the nativeStorage nodeIp or the nodeIp_default
  public nodeIp_default = 'https://maccarese.asuscomm.com:8443' // 'http://maccarese.asuscomm.com:8081'
  public nodeIp = ''

  // to run createAccount
  public naprk = '439c82fcb5f6ab7397c5f62cf7f9bd8b4284070514b6026725d160e873deb0d6'
  public na = 'na@' + this.domainId
  public qrcode_size = 200

  public mywalletIsopen = false

  public loadingController_timeout = 120000 // autodismiss any loadingController after msecs

  private secureKey: string;
  private secureIV: string;
  private force_simplecrypto = true  // if true do not use native Android & IOS AES256

  constructor(private nativeStorage: NativeStorage,
    private aes256: AES256,
    public plt: Platform,
    private alertController: AlertController
  ) {
    this.secureKey = ''
    this.secureIV = ''

    //this.irohautil.console_log(this.plt.platforms())

  }

  login_na() {

    return irohaUtil.login(this.na, this.naprk, this.nodeIp)
      .then(() => {
        return Promise.resolve()
      })
      .catch(err => {
        this.console_log("irohautil.service.login_na - " + err)
        this.alert("Problemi di connessione al Server")
        return Promise.reject(err)
      })
  }

  login_restore(username, privateKey) {

    return irohaUtil.login(username, privateKey, this.nodeIp)
      .then(() => {
        return Promise.resolve()
      })
      .catch(err => {
        this.console_log("irohautil.service.login_restore - " + err)

        if (err.message.includes('errorCode":3')) {

          this.console_log("Login error: wrong wallet/key")
          this.alert("Errore accesso: wallet/key errati")
          return Promise.reject(err)

        }else if (
          err.message.includes('Response closed without headers') ||
          err.message.includes('TransientFailure')) {

          this.console_log("Connection issues with the Server")
          this.alert("Problemi di connessione al Server")
          return Promise.reject(err)

        }

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
                this.console_log("Error login run_getAssetInfo: " + err)
                //return Promise.reject(err)
              })
          })
          .catch(err => {
            this.console_log("Error login run_getAccountAssets: " + err)
            //return Promise.reject(err)
          })

        return Promise.resolve(account)
      })
      .catch(err => {
        this.console_log("irohautil.servicelogin - " + err)
        if (err.message.includes('errorCode":3')) {

          this.console_log("Login error: wrong wallet/key")
          this.alert("Errore accesso: wallet/key errati")
          return Promise.reject(err)

        }
        else if (
          err.message.includes('Response closed without headers') ||
          err.message.includes('TransientFailure')) {

          this.console_log("Connection issues with the Server")
          this.alert("Problemi di connessione al Server")
          return Promise.reject(err)

        }
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
        this.console_log("Error run_getAccountAssetTransactions: " + err)
        this.console_log(JSON.stringify(err))
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
          this.console_log("Error getAccountAssets: " + JSON.stringify(err))
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

  async generateSecureKeyAndIV(mypw) {

    this.secureKey = await this.aes256.generateSecureKey(mypw); // Returns a 32 bytes string
    this.secureIV = await this.aes256.generateSecureIV(mypw); // Returns a 16 bytes string

  }

  async encrypt_mypw(data, mypw) {

    if (!this.force_simplecrypto && (this.plt.is('android') || this.plt.is('ios'))) {

      if (this.secureKey != '') await this.generateSecureKeyAndIV(mypw)

      this.aes256.encrypt(this.secureKey, this.secureIV, data)
        .then((res) => {
          this.wallet.mypw = true;
          return res
        })
        .catch((error: any) => console.error("Error encrypt_mypw: " + error))

    } else {

      var simpleCrypto = new SimpleCrypto(mypw)
      return simpleCrypto.encrypt(data)

    }
  }

  async decrypt_mypw(data, mypw) {

    if (!this.force_simplecrypto && (this.plt.is('android') || this.plt.is('ios'))) {

      if (this.secureKey != '') await this.generateSecureKeyAndIV(mypw)
      this.aes256.decrypt(this.secureKey, this.secureIV, data)
        .then((res) => {
          return res
        })
        .catch((error: any) => console.error("Error decrypt_mypw: " + error))

    } else {

      var simpleCrypto = new SimpleCrypto(mypw)
      return simpleCrypto.decrypt(data)

    }

  }

  async rmkeys() {
    await this.nativeStorage.remove('nodeIp').then(
      _ => this.nodeIp = null,
      err => this.alert("Error rm nativeStorage: nodeIp " + JSON.stringify(err))
    )

    await this.nativeStorage.remove('mywallet').then(
      _ => this.wallet.mywallet = null,
      err => this.alert("Error rm nativeStorage: mywallet " + JSON.stringify(err))
    )

    await this.nativeStorage.remove('myprk').then(
      _ => this.wallet.myprk = null,
      err => this.alert("Error rm nativeStorage: myprk " + JSON.stringify(err))
    )

    await this.nativeStorage.remove('mypuk').then(
      _ => this.wallet.mypuk = null,
    ).catch(err => this.alert("Error rm nativeStorage: mypuk " + JSON.stringify(err)))

    await this.nativeStorage.remove('mypw').then(
      _ => this.wallet.mypw = null,
    ).catch(err => this.alert("Error rm nativeStorage: mypw " + JSON.stringify(err)))

    await this.nativeStorage.remove('cur_assetId').then(
      _ => this.wallet.cur_assetId = null,
    ).catch(err => this.alert("Error rm nativeStorage: cur_assetId " + JSON.stringify(err)))


  }

  wallet_close(msg) {

    this.nodeIp = null
    this.wallet.mywallet = null
    this.wallet.myprk = null
    this.wallet.mypuk = null
    this.wallet.mypw = null
    this.wallet.cur_assetId = null
    this.mywalletIsopen = false

    //window.location.reload() looks ok but not with browser
    //this.router.navigateByUrl('/') no good as it uses the cache
    if (msg.length > 0) this.alert(msg)

    location.assign('/')

  }


  async alert(msg) {
    const alert = await this.alertController.create({
      message: msg,
      buttons: [ 'OK' ]
    });

    await alert.present();
  }

  console_log(msg) {
    if(this.debug_console_log) console.log(msg)
  }

}
