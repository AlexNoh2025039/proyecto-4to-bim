import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminQuestionsList } from './admin-questions-list';

describe('AdminQuestionsList', () => {
  let component: AdminQuestionsList;
  let fixture: ComponentFixture<AdminQuestionsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminQuestionsList],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminQuestionsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
