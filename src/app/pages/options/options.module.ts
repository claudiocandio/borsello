import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { OptionsPage } from './options.page';
import { QRCodeModule } from 'angularx-qrcode'; // https://www.npmjs.com/package/angularx-qrcode
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
  {
    path: '',
    component: OptionsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    QRCodeModule,
    TranslateModule
  ],
  declarations: [OptionsPage]
})
export class OptionsPageModule {}
