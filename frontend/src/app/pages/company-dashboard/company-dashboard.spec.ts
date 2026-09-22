import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyDashboardComponent } from './company-dashboard';

describe('CompanyDashboardComponent', () => {
  let component: CompanyDashboardComponent;
  let fixture: ComponentFixture<CompanyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
