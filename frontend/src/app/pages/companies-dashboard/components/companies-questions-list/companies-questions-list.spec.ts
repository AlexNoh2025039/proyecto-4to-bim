import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompaniesQuestionsList } from './companies-questions-list';

describe('CompaniesQuestionsList', () => {
  let component: CompaniesQuestionsList;
  let fixture: ComponentFixture<CompaniesQuestionsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompaniesQuestionsList],
    }).compileComponents();

    fixture = TestBed.createComponent(CompaniesQuestionsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
