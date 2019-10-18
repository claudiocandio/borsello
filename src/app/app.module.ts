import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File } from '@ionic-native/file/ngx';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { QRCodeModule } from 'angularx-qrcode'; // https://www.npmjs.com/package/angularx-qrcode
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { AES256 } from '@ionic-native/aes-256/ngx';
import { Clipboard } from '@ionic-native/clipboard/ngx';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { IrohautilService } from './services/irohautil.service'

import { Injector, APP_INITIALIZER } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LOCATION_INITIALIZED } from '@angular/common';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

export function appInitializerFactory(
  translate: TranslateService,
  injector: Injector,
  nativeStorage: NativeStorage
) {
  return () => new Promise<any>((resolve: any) => {
    const locationInitialized = injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
    locationInitialized.then(() => {

      nativeStorage.getItem('wallet_lang')
        .then((lang_selected) => {
          translate.setDefaultLang(lang_selected);
          translate.use(lang_selected).subscribe(() => {
            console.info('Successfully initialized language.')
          }, err => {
            console.error('Problem with language initialization.')
          }, () => {
            resolve(null);
          });
        })
        .catch(() => { // default language it
          const langToSet = 'it'
          translate.setDefaultLang('en');
          translate.use(langToSet).subscribe(() => {
            console.info('Successfully initialized language.')
          }, err => {
            console.error('Problem with language initialization.')
          }, () => {
            resolve(null);
          });

        })
    });
  });
}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    QRCodeModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [TranslateService, Injector, NativeStorage],
      multi: true
    },
    NativeStorage,
    FileChooser,
    File,
    BarcodeScanner,
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    IrohautilService,
    AES256,
    Clipboard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
