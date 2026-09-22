import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface CourseCardItem {
  titulo: string;
  categoria?: string;
  duracion?: string;
  descripcion?: string;
  habilidades?: string[];
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './course-card.css',
  templateUrl: './course-card.html',
})
export class CourseCard {
  @Input() curso: CourseCardItem = {
    titulo: 'Curso de reforzamiento',
    categoria: 'General',
    duracion: '2 semanas',
    descripcion: 'Curso orientado a reforzar las habilidades necesarias para el puesto.',
    habilidades: ['Análisis', 'Comunicación']
  };
}
