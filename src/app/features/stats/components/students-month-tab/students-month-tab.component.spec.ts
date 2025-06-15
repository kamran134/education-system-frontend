import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsMonthTabComponent } from './students-month-tab.component';

describe('StudentsMonthTabComponent', () => {
  let component: StudentsMonthTabComponent;
  let fixture: ComponentFixture<StudentsMonthTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsMonthTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentsMonthTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
