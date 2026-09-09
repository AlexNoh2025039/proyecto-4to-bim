import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompatibilityBadge } from './compatibility-badge';

describe('CompatibilityBadge', () => {
  let component: CompatibilityBadge;
  let fixture: ComponentFixture<CompatibilityBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompatibilityBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(CompatibilityBadge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
