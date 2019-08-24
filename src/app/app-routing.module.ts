import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './pages/home/home.module#HomePageModule'
  },
  {
    path: 'list',
    loadChildren: './pages/list/list.module#ListPageModule'
  },
  { 
    path: 'send',
    loadChildren: './pages/send/send.module#SendPageModule' 
  },
  { 
    path: 'transaction-show/:txFrom/:txTo/:txAmount/:txDate/:txCurrency/:txPuk/:txMessage',
    loadChildren: './pages/transaction-show/transaction-show.module#TransactionShowPageModule' 
  },
  { 
    path: 'options',
    loadChildren: './pages/options/options.module#OptionsPageModule' 
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
