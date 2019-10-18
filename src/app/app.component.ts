import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IrohautilService } from './services/irohautil.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public appPages = [
    {
      title: 'WALLET.tab',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'TXS.tab',
      url: '/list',
      icon: 'list'
    },
    {
      title: 'SEND.tab',
      url: '/send',
      icon: 'send'
    },
    {
      title: 'OPTIONS.tab',
      url: '/options',
      icon: 'options'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private irohautil: IrohautilService,
    private translate: TranslateService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.irohautil.setInitialAppLanguage();
    });
  }
}
