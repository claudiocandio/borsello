import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-transaction-show',
  templateUrl: './transaction-show.page.html',
  styleUrls: ['./transaction-show.page.scss'],
})
export class TransactionShowPage implements OnInit {

  txFrom = null;
  txTo = null;
  txAmount = null;
  txDate = null;
  txCurrency = null;
  txPuk = null;
  txMessage = null;

  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.txFrom = this.activatedRoute.snapshot.paramMap.get('txFrom');
    this.txTo = this.activatedRoute.snapshot.paramMap.get('txTo');
    this.txAmount = this.activatedRoute.snapshot.paramMap.get('txAmount');
    this.txDate = this.activatedRoute.snapshot.paramMap.get('txDate');
    this.txCurrency = this.activatedRoute.snapshot.paramMap.get('txCurrency');
    this.txPuk = this.activatedRoute.snapshot.paramMap.get('txPuk');
    this.txMessage = this.activatedRoute.snapshot.paramMap.get('txMessage');

  }

}
