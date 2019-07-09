import { TestBed } from '@angular/core/testing';

import { IrohautilService } from './irohautil.service';

describe('IrohautilService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: IrohautilService = TestBed.get(IrohautilService);
    expect(service).toBeTruthy();
  });
});
