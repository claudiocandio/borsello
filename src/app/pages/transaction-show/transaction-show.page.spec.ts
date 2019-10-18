import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionShowPage } from './transaction-show.page';

describe('TransactionShowPage', () => {
  let component: TransactionShowPage;
  let fixture: ComponentFixture<TransactionShowPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransactionShowPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionShowPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
