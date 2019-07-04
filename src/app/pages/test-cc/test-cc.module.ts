import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TestCCPage } from './test-cc.page';

import { QRCodeModule } from 'angularx-qrcode'; // https://www.npmjs.com/package/angularx-qrcode

const routes: Routes = [
  {
    path: '',
    component: TestCCPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    QRCodeModule
  ],
  declarations: [TestCCPage]
})
export class TestCCPageModule {}
