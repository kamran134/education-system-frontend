import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeachersYearTabComponent } from './teachers-year-tab.component';

describe('TeachersYearTabComponent', () => {
  let component: TeachersYearTabComponent;
  let fixture: ComponentFixture<TeachersYearTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeachersYearTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TeachersYearTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
