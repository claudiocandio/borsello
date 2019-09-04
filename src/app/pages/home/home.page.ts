import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonSelect, LoadingController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';


import { IrohautilService } from '../../services/irohautil.service'
import { derivePublicKey } from 'ed25519.js'

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {

  constructor(private nativeStorage: NativeStorage,
    private barcodeScanner: BarcodeScanner,
    public irohautil: IrohautilService,
    public loadingController: LoadingController
  ) {

    this.barcodeScannerOptions = {
      showTorchButton: true,
      showFlipCameraButton: true
    }

  }

  private myprk_restore = ''
  public myprk_restore_min = 0
  public mywallet_restore_button = 'Crea Wallet'

  private mypw = ''

  barcodeScannerOptions: BarcodeScannerOptions;

  async ngOnInit() {

    let loading_done = false
    const loading = await this.loadingController.create({
      message: 'Caricamento in corso...',
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout
    })
    loading.onDidDismiss().then(() => {
      if(!loading_done) this.irohautil.alert("Timeout nessuna risposta ricevuta")
    })
    loading.present().then(async () => {

      if (!this.irohautil.mywalletIsopen) {  // if wallet not open

        if (this.irohautil.nodeIp_force) {
          this.irohautil.nodeIp = this.irohautil.nodeIp_force

          await this.nativeStorage.setItem('nodeIp', this.irohautil.nodeIp_force)
            .catch((err) => {
              console.log(JSON.stringify(err))
              this.irohautil.alert("Error storing nodeIp: " + JSON.stringify(err));
            })

        } else await this.nativeStorage.getItem('nodeIp').then(
          nodeIp => this.irohautil.nodeIp = nodeIp,
          _ => this.irohautil.nodeIp = this.irohautil.nodeIp_default
        )

        await this.nativeStorage.getItem('mypw').then( // check wheter wallet is encrypted
          mypw => this.irohautil.wallet.mypw = mypw,
          _ => this.irohautil.wallet.mypw = false
        )

        await this.nativeStorage.getItem('mypuk').then(
          mypuk => this.irohautil.wallet.mypuk = mypuk,
          _ => this.irohautil.wallet.mypuk = null
        )

        await this.nativeStorage.getItem('myprk').then(
          myprk => this.irohautil.wallet.myprk = myprk,
          _ => this.irohautil.wallet.myprk = null
        )

        await this.nativeStorage.getItem('cur_assetId').then(
          cur_assetId => this.irohautil.wallet.cur_assetId = cur_assetId,
          _ => this.irohautil.wallet.cur_assetId = null
        )

        await this.nativeStorage.getItem('mywallet')
          .then(async mywallet => {
            this.irohautil.wallet.mywallet = mywallet

            if (!this.irohautil.wallet.mypw) { // if wallet not encrypted then login
              await this.login()
                .then(() => this.irohautil.mywalletIsopen = true)
                .catch(() => {
                  loading.dismiss()
                }) 
            }
          },
            _ => this.irohautil.wallet.mywallet = null
          )
      }

      loading_done = true
      loading.dismiss()
    })

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

  async newwallet(form: NgForm) {

    if (form.valid) {

      if (this.myprk_restore.length > 0) {  // restore wallet
        
        let loading_done = false
        const loading = await this.loadingController.create({
          message: 'Restore Wallet in corso...',
          translucent: true,
          spinner: 'lines',
          duration: this.irohautil.loadingController_timeout
        })
        loading.onDidDismiss().then(() => {
          if(!loading_done) this.irohautil.alert("Timeout nessuna risposta ricevuta")
        })
        loading.present().then(async () => {

          await this.irohautil.login_restore(this.irohautil.wallet.mywallet + '@' + this.irohautil.domainId, this.myprk_restore)
            .then(async () => {
              let wal; let prk; let puk

              this.irohautil.wallet.mypuk = derivePublicKey(Buffer.from(this.myprk_restore, 'hex')).toString('hex')
              this.irohautil.wallet.myprk = this.myprk_restore
              this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet + '@' + this.irohautil.domainId


              if (this.mypw.length > 0) {
                this.irohautil.wallet.mypw = true // new encrypted wallet with password

                wal = await this.irohautil.encrypt_mypw(this.irohautil.wallet.mywallet, this.mypw)
                puk = await this.irohautil.encrypt_mypw(this.irohautil.wallet.mypuk, this.mypw)
                prk = await this.irohautil.encrypt_mypw(this.irohautil.wallet.myprk, this.mypw)

              } else { // do not encrypt
                this.irohautil.wallet.mypw = false // wallet with NO encryption

                wal = this.irohautil.wallet.mywallet
                puk = this.irohautil.wallet.mypuk
                prk = this.irohautil.wallet.myprk
              }

              this.nativeStorage.setItem('mypw', this.irohautil.wallet.mypw)
                .catch(err => this.irohautil.alert("Error storing mypw: " + JSON.stringify(err)));

              this.nativeStorage.setItem('mywallet', wal)
                .catch(err => this.irohautil.alert("Error storing mywallet: " + JSON.stringify(err)));

              this.nativeStorage.setItem('mypuk', puk)
                .catch(err => this.irohautil.alert("Error storing mypuk: " + JSON.stringify(err)));

              this.nativeStorage.setItem('myprk', prk)
                .catch(err => this.irohautil.alert("Error storing myprk: " + JSON.stringify(err)));

              this.login() // to reload data
                .catch(err => console.log(err))

              this.irohautil.mywalletIsopen = true
              this.irohautil.alert("Restore Wallet completato con successo")

              // clean for next remove wallet
              this.myprk_restore = ''
              this.myprk_restore_min = 0
              this.mywallet_restore_button = 'Crea Wallet'
            })
            .catch(err => {
              console.log(err)
              this.irohautil.alert("Restore Wallet fallito!")
            })

          loading_done = true
          loading.dismiss();
        })

      } else { // new wallet

        let loading_done = false
        const loading = await this.loadingController.create({
          message: 'Creazione Wallet in corso...',
          translucent: true,
          spinner: 'lines',
          duration: this.irohautil.loadingController_timeout
        })
        loading.onDidDismiss().then(() => {
          if(!loading_done) this.irohautil.alert("Timeout nessuna risposta ricevuta")
        })
        loading.present().then(async () => {

          await this.irohautil.login_na() // login with na to create account
            .then(async () => {

              await this.irohautil.generateKeypair()
                .then(async ({ publicKey, privateKey }) => {

                  await this.irohautil.run_createAccount(this.irohautil.wallet.mywallet, publicKey)
                    .then(async () => {
                      let wal; let prk; let puk

                      this.irohautil.wallet.mypuk = publicKey
                      this.irohautil.wallet.myprk = privateKey
                      this.irohautil.wallet.mywallet = this.irohautil.wallet.mywallet + '@' + this.irohautil.domainId

                      if (this.mypw.length > 0) {
                        this.irohautil.wallet.mypw = true // new encrypted wallet with password

                        wal = await this.irohautil.encrypt_mypw(this.irohautil.wallet.mywallet, this.mypw)
                        puk = await this.irohautil.encrypt_mypw(publicKey, this.mypw)
                        prk = await this.irohautil.encrypt_mypw(privateKey, this.mypw)

                      } else { // do not encrypt
                        this.irohautil.wallet.mypw = false // wallet with NO encryption

                        wal = this.irohautil.wallet.mywallet
                        puk = publicKey
                        prk = privateKey
                      }

                      this.nativeStorage.setItem('mypw', this.irohautil.wallet.mypw)
                        .catch(err => this.irohautil.alert("Error storing mypw: " + JSON.stringify(err)));

                      this.nativeStorage.setItem('mywallet', wal)
                        .catch(err => this.irohautil.alert("Error storing mywallet: " + JSON.stringify(err)));

                      this.nativeStorage.setItem('mypuk', puk)
                        .catch(err => this.irohautil.alert("Error storing mypuk: " + JSON.stringify(err)));

                      this.nativeStorage.setItem('myprk', prk)
                        .catch(err => this.irohautil.alert("Error storing myprk: " + JSON.stringify(err)));

                      await this.login() // to reload data
                        .catch(err => console.log(err))

                      this.irohautil.mywalletIsopen = true

                      this.irohautil.alert("Wallet creato con successo")
                    })
                    .catch(err => {
                      console.log(JSON.stringify(err))

                      if (err.includes("expected=COMMITTED, actual=STATEFUL_VALIDATION_FAILED")) this.irohautil.alert("Nome Wallet già presente!\n")
                      else this.irohautil.alert("Creazione Wallet fallita!")
                    })
                })
                .catch(err => {
                  console.log(err)
                  this.irohautil.alert("Creazione Wallet fallita!")
                })

            })
            .catch(err => {
              console.log(err)
              this.irohautil.alert("Creazione Wallet fallita!\nProblemi di connessione al Server.")
            })

          loading_done = true
          loading.dismiss()
        })
      }
    }

  }

  mywallet_restore_change() {
    //console.log(this.myprk_restore)
    if (this.myprk_restore.length > 0) {
      this.myprk_restore_min = this.myprk_restore_min = 64
      this.mywallet_restore_button = 'Restore Wallet'
    } else {
      this.myprk_restore_min = this.myprk_restore_min = 0
      this.mywallet_restore_button = 'Crea Wallet'
    }
  }

  scanCode_mywallet() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //console.log("Barcode data " + JSON.stringify(barcodeData));

        if (barcodeData.text.includes('@' + this.irohautil.domainId)) // remove domainId when creating new wallet
          this.irohautil.wallet.mywallet = barcodeData.text.substring(0, barcodeData.text.indexOf('@' + this.irohautil.domainId))
        else if (barcodeData.text.includes('@')) {
          this.irohautil.wallet.mywallet = ''
          this.irohautil.alert("Code invalido")
        } else this.irohautil.wallet.mywallet = barcodeData.text

      })
      .catch(err => {
        console.log("Error scanCode_mywallet: ", err)
      });
  }

  scanCode_myprk() {
    this.barcodeScanner
      .scan()
      .then(barcodeData => {
        //console.log("Barcode data " + JSON.stringify(barcodeData));

        if (barcodeData.text.length == 64)
          this.myprk_restore = barcodeData.text
        else {
          this.myprk_restore = ''
          this.irohautil.alert("Code invalido")
        }

      })
      .catch(err => {
        console.log("Error scanCode_mywallet: ", err);
      })
  }

  async login() {

    return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
      .catch((err) => {
        return Promise.reject(err)
      })

  }

  async mypw_submit() {

    const loading = await this.loadingController.create({
      message: 'Accesso Wallet in corso...',
      translucent: true,
      spinner: 'lines',
      duration: this.irohautil.loadingController_timeout  // (autodismiss after n msecs)
    })
    loading.onDidDismiss().then(() => {
      if(!this.irohautil.mywalletIsopen) this.irohautil.alert("Timeout nessuna risposta ricevuta")
    })
    loading.present().then(async () => {

    let wal; let prk; let puk

    wal = await this.irohautil.decrypt_mypw(this.irohautil.wallet.mywallet, this.mypw)
    if (wal.length > 0) { // password is ok
      puk = await this.irohautil.decrypt_mypw(this.irohautil.wallet.mypuk, this.mypw)
      prk = await this.irohautil.decrypt_mypw(this.irohautil.wallet.myprk, this.mypw)

      await this.irohautil.login_restore(wal, prk)
        .then(async () => {
          this.irohautil.wallet.mywallet = wal
          this.irohautil.wallet.mypuk = puk
          this.irohautil.wallet.myprk = prk
          this.irohautil.wallet.mypw = true
          this.mypw = '' // clear password
          await this.login()
            .then(() => {
              this.irohautil.mywalletIsopen = true
            })
            .catch(err => console.log(err))
        })
        .catch(err => {
          console.log("home.page.mypw_submit - "+err)
        })

    } else this.irohautil.alert("Password errata")

    loading.dismiss()
  })
  
}


  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';
  hideShowPassword() {
      this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
      this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }


}