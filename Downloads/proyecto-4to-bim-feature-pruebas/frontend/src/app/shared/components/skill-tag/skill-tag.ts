import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skill-tag',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './skill-tag.css',
  templateUrl: './skill-tag.html',
})
export class SkillTag {
  @Input() skill: string = 'Habilidad';
  @Input() tone: 'primary' | 'success' | 'warning' | 'neutral' = 'primary';
}
