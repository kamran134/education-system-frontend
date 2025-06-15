import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistrictsYearTabComponent } from './districts-year-tab.component';

describe('DistrictsYearTabComponent', () => {
  let component: DistrictsYearTabComponent;
  let fixture: ComponentFixture<DistrictsYearTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistrictsYearTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DistrictsYearTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
