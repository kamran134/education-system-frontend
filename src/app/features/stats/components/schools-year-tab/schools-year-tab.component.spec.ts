import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolsYearTabComponent } from './schools-year-tab.component';

describe('SchoolsYearTabComponent', () => {
  let component: SchoolsYearTabComponent;
  let fixture: ComponentFixture<SchoolsYearTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolsYearTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SchoolsYearTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
