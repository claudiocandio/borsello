import { Component, OnInit } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { AlertController, LoadingController } from '@ionic/angular'; // Per alert https://ionicframework.com/docs/api/alert

import { IrohautilService } from '../../services/irohautil.service'


@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
})
export class OptionsPage implements OnInit {

  public show_mypuk_barcode: boolean
  public show_myprk_barcode: boolean
  public nodeIp = this.irohautil.nodeIp
  public nodeIp_changed: boolean

  constructor(private nativeStorage: NativeStorage,
    public irohautil: IrohautilService,
    private alertController: AlertController,
    public loadingController: LoadingController
  ) {

    this.show_mypuk_barcode = false
    this.show_myprk_barcode = false
    this.nodeIp_changed = false

  }

  ngOnInit() {
  }


  mypuk_barcode_toggle_change() {

    if (this.irohautil.wallet.mypuk != null)
      if (this.show_mypuk_barcode) {
        this.show_mypuk_barcode = false
      } else {
        this.show_mypuk_barcode = true
      }

  }

  myprk_barcode_toggle_change() {

    if (this.irohautil.wallet.mypuk != null)
      if (this.show_myprk_barcode) {
        this.show_myprk_barcode = false
      } else {
        this.show_myprk_barcode = true
      }

  }

  nodeIp_change() {

    if (this.nodeIp != this.irohautil.nodeIp) {
      this.nodeIp_changed = true
    } else {
      this.nodeIp_changed = false
    }

  }

  nodeIp_save() {

    this.nativeStorage.setItem('nodeIp', this.nodeIp)
      .then(() => {
        this.irohautil.nodeIp = this.nodeIp
        this.nodeIp_changed = false
        alert("Indirizzo Server modificato")

        if (this.irohautil.wallet.mywallet)
          return this.irohautil.login(this.irohautil.wallet.mywallet, this.irohautil.wallet.myprk)
            .catch((err) => {
              console.log(JSON.stringify(err))
            })

      })
      .catch((err) => {
        console.log(JSON.stringify(err))
        alert("Error storing nodeIp: " + JSON.stringify(err));
      })
  }

  async rmkeys_confirm() {
    const alert = await this.alertController.create({
      header: 'Conferma cancellazione!',
      message: '<strong>Il Wallet verrà cancellato! Sei sicuro?</strong>',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'OK',
          handler: () => {
            this.rmkeys()
          }
        }
      ]
    });

    await alert.present();
  }

  async rmkeys() {

    const loading = await this.loadingController.create({
      message: 'Rimozione Wallet in corso...',
      translucent: true,
      spinner: 'lines'   // "bubbles" | "circles" | "crescent" | "dots" | "lines" | "lines-small" | null | undefined
      //duration: 5000   (autodismiss after 5 secs)
    })
    loading.present().then(async () => {


      await this.nativeStorage.remove('nodeIp').then(
        _ => this.irohautil.wallet.mywallet = null,
        err => alert("Error rm nativeStorage: nodeIp " + JSON.stringify(err))
      )

      await this.nativeStorage.remove('mywallet').then(
        _ => this.irohautil.wallet.mywallet = null,
        err => alert("Error rm nativeStorage: mywallet " + JSON.stringify(err))
      )

      await this.nativeStorage.remove('myprk').then(
        _ => this.irohautil.wallet.mywallet = null,
        err => alert("Error rm nativeStorage: myprk " + JSON.stringify(err))
      )

      await this.nativeStorage.remove('mypuk').then(_ => {
        _ => this.irohautil.wallet.mywallet = null
        window.location.reload()
      }).catch(err => alert("Error rm nativeStorage: mywallet " + JSON.stringify(err)))

      await this.nativeStorage.remove('cur_assetId').then(_ => {
        _ => this.irohautil.wallet.cur_assetId = null
        //      window.location.reload()
      }).catch(err => alert("Error rm nativeStorage: cur_assetId " + JSON.stringify(err)))


      loading.dismiss()
    })

  }

}
