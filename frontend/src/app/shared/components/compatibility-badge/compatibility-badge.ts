import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-compatibility-badge',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './compatibility-badge.css',
  templateUrl: './compatibility-badge.html',
})
export class CompatibilityBadge {
  @Input() value: number = 0;
  @Input() label: string = 'Compatibilidad';

  get normalizedValue(): number {
    return Math.min(100, Math.max(0, this.value));
  }

  get compatible(): boolean {
    return this.normalizedValue >= 70;
  }
}