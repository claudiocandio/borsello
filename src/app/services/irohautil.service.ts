import * as iroha from 'iroha-lib'   // this has to be on top, otherwise it gives error TypeError: message.getMainPubkey_asU8 is not a function
const crypto = new iroha.ModelCrypto() // npm i iroha-lib

import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Injectable, ViewChild } from '@angular/core';
import irohaUtil from '../../util/iroha/'
import { AES256 } from '@ionic-native/aes-256/ngx';
import { Platform, AlertController, IonSelect } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import SimpleCrypto from "simple-crypto-js";

export interface WalletData {
  mywallet: string;
  mypuk: string;
  myprk: string;
  mywalletIsEncrypted: boolean;
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
  public version = 'v1.0.7'
  public debug_console_log = false // whether to use console.log to debug
  public password_min_len_gt = 1 // greater than, 1 means at least 2 chars, password length at least 2 chars as 1 char won't work correctly

  public domainId = 'mini'
  public wallet: WalletData = {
    mywallet: '',
    mypuk: null,
    myprk: null,
    mywalletIsEncrypted: false,
    assets: null,
    cur_assetId: '',
    cur_assetId_decimal: null
  }

  public nodeIp_force = null // null to use the nativeStorage nodeIp or the nodeIp_default
  public nodeIp_default = 'http://127.0.0.1:8081'
  public nodeIp = ''

  // default number of transactions when listing
  public pageTxs_default: number = 50
  public pageTxs: number = this.pageTxs_default

  // default language if browser lang is not it or en
  private language_default = 'it' // 'it' or 'en'

  // to run createAccount
  public naprk = '439c82fcb5f6ab7397c5f62cf7f9bd8b4284070514b6026725d160e873deb0d6'
  public na = 'na@' + this.domainId
  public qrcode_size = 200

  public mywalletIsopen = false

  public loadingController_timeout = 120000 // autodismiss any loadingController after msecs

  private secureKey: string;
  private secureIV: string;
  private force_simplecrypto = true  // if true do not use native Android & IOS AES256

  constructor(
    private nativeStorage: NativeStorage,
    private aes256: AES256,
    public plt: Platform,
    private alertController: AlertController,
    private translate: TranslateService
  ) {
    this.secureKey = ''
    this.secureIV = ''
    //this.irohautil.console_log(this.plt.platforms())
  }

  // start language select //
  public lang_selected = '';
  async setInitialAppLanguage() {


    this.translate.setDefaultLang(this.language_default);

    this.nativeStorage.getItem('wallet_lang')
      .then((lang_selected) => {
        this.lang_selected = lang_selected
        this.setLanguage(this.lang_selected)
      })
      .catch(() => {
        // override language_default with browser lang if supported
        let language_browser = this.translate.getBrowserLang();
        this.console_log("Browser lang: " + language_browser)
        if (language_browser == 'it' || language_browser == 'en')
          this.language_default = language_browser

        this.lang_selected = this.language_default
        this.setLanguage(this.lang_selected)
        this.nativeStorage.setItem('wallet_lang', this.lang_selected)
          .catch(err => {
            this.console_log("Error nativeStorage.setItem wallet_lang: " + err)
          })
      })

  }
  getLanguages() {
    return [
      { text: 'English', value: 'en', img: 'assets/img/en.png' },
      { text: 'Italiano', value: 'it', img: 'assets/img/it.png' },
    ];
  }
  setLanguage(lng) {
    this.translate.use(lng).subscribe(() => {
      this.console_log('Successfully initialized language: '+lng)
    }, err => {
      this.console_log('Error language initialization: '+lng)
    }, () => {
    });


    //this.translate.use(lng)
    this.lang_selected = lng
    this.nativeStorage.setItem('wallet_lang', lng)
      .catch(err => {
        this.console_log("Error nativeStorage.setItem wallet_lang: " + err)
      })
  }
  // end language select //


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

    return irohaUtil.login(username + '@' + this.domainId, privateKey, this.nodeIp)
      .then(() => {
        return Promise.resolve()
      })
      .catch(err => {
        this.console_log("irohautil.service.login_restore - " + err)

        if (err.message.includes('errorCode":3')) {

          this.console_log("Login error: wrong wallet/key")
          this.alert("Errore accesso: wallet/key errati")
          return Promise.reject(err)

        } else if (
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

    return irohaUtil.login(username + '@' + this.domainId, privateKey, this.nodeIp)
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

  run_getAccountAssetTransactions(username, assetId, firstTxHash = undefined, pageSize = this.pageTxs) {
    // irohaUtil.getAccountTransactions({ .. no good as it only returns trx done my me, not those from other to me

    return irohaUtil.getAccountAssetTransactions({
      accountId: username + '@' + this.domainId,
      assetId: assetId + '#' + this.domainId,
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

  run_getAccountAssets(username, pageSize = 100) {

    if (username)
      return irohaUtil.getAccountAssets({
        accountId: username + '@' + this.domainId,
        pageSize
      })
        .then(assets => {
          // removing #domainId  
          for (var i = 0, len = assets.length; i < len; i++) {
            assets[i].assetId = assets[i].assetId.split('#')[0]
          }

          return assets
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
        srcAccountId: this.wallet.mywallet + '@' + this.domainId,
        destAccountId: walletTo + '@' + this.domainId,
        assetId: this.wallet.cur_assetId + '#' + this.domainId,
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
      assetId: assetId + '#' + this.domainId
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

  async generateSecureKeyAndIV(mywalletpw) {

    this.secureKey = await this.aes256.generateSecureKey(mywalletpw); // Returns a 32 bytes string
    this.secureIV = await this.aes256.generateSecureIV(mywalletpw); // Returns a 16 bytes string

  }

  async encrypt_mywallet(data, mywalletpw) {

    if (!this.force_simplecrypto && (this.plt.is('android') || this.plt.is('ios'))) {

      if (this.secureKey != '') await this.generateSecureKeyAndIV(mywalletpw)

      this.aes256.encrypt(this.secureKey, this.secureIV, data)
        .then((res) => {
          this.wallet.mywalletIsEncrypted = true;
          return res
        })
        .catch((error: any) => console.error("Error encrypt_mywallet: " + error))

    } else {

      var simpleCrypto = new SimpleCrypto(mywalletpw)
      return simpleCrypto.encrypt(data)

    }
  }

  async decrypt_mywallet(data, mywalletpw) {

    if (!this.force_simplecrypto && (this.plt.is('android') || this.plt.is('ios'))) {

      if (this.secureKey != '') await this.generateSecureKeyAndIV(mywalletpw)
      this.aes256.decrypt(this.secureKey, this.secureIV, data)
        .then((res) => {
          return res
        })
        .catch((error: any) => console.error("Error decrypt_mywallet: " + error))

    } else {

      var simpleCrypto = new SimpleCrypto(mywalletpw)
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

    await this.nativeStorage.remove('mywalletIsEncrypted').then(
      _ => this.wallet.mywalletIsEncrypted = null,
    ).catch(err => this.alert("Error rm nativeStorage: mywalletIsEncrypted " + JSON.stringify(err)))

    await this.nativeStorage.remove('cur_assetId').then(
      _ => this.wallet.cur_assetId = null,
    ).catch(err => this.alert("Error rm nativeStorage: cur_assetId " + JSON.stringify(err)))

    await this.nativeStorage.remove('pageTxs').then(
      _ => this.pageTxs = this.pageTxs_default,
    ).catch(err => this.alert("Error rm nativeStorage: pageTxs " + JSON.stringify(err)))

  }

  wallet_close() {

    this.nodeIp = null
    this.wallet.mywallet = null
    this.wallet.myprk = null
    this.wallet.mypuk = null
    this.wallet.mywalletIsEncrypted = null
    this.wallet.cur_assetId = null
    this.mywalletIsopen = false

    //window.location.reload() looks ok but not with browser
    //this.router.navigateByUrl('/') no good as it uses the cache
    //if (msg.length > 0) this.alert(msg)

    location.assign('/')

  }

  async alert(msg) {
    const alert = await this.alertController.create({
      message: msg,
      buttons: ['OK']
    });

    await alert.present();
  }

  console_log(msg) {
    if (this.debug_console_log) console.log(msg)
  }

}

