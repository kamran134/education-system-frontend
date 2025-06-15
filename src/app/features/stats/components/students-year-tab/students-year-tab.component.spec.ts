import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsYearTabComponent } from './students-year-tab.component';

describe('StudentsYearTabComponent', () => {
  let component: StudentsYearTabComponent;
  let fixture: ComponentFixture<StudentsYearTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsYearTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentsYearTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
