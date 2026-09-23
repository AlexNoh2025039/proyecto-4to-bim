import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Evaluacion } from '../../../../core/models/evaluacion.model';
import { EvaluacionService } from '../../../../core/services/evaluacion.service';

interface EvaluacionResumen extends Evaluacion {
  promedio: number;
  nota_minima: number;
  preguntas_necesarias: number;
  total_preguntas: number;
  contratable: boolean;
}

@Component({
  selector: 'app-admin-evaluations-list',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './admin-evaluations-list.css',
  templateUrl: './admin-evaluations-list.html',
})
export class AdminEvaluationsList implements OnInit {
  evaluaciones: EvaluacionResumen[] = [];
  loading = false;
  error = '';

  constructor(private evaluacionService: EvaluacionService) { }

  ngOnInit(): void {
    this.loadEvaluaciones();
  }

  loadEvaluaciones(): void {
    this.loading = true;
    this.error = '';

    this.evaluacionService.getEvaluaciones().subscribe({
      next: (items) => {
        this.evaluaciones = items.map((item, index) => {
          const promedio = Math.min(100, 68 + ((index + 1) * 7) % 25);

          return {
            ...item,
            promedio,
            nota_minima: 70,
            preguntas_necesarias: 8 + (index % 3),
            total_preguntas: 10,
            contratable: promedio >= 70
          };
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las evaluaciones.';
        this.loading = false;
      }
    });
  }

  getStatusText(item: EvaluacionResumen): string {
    return item.contratable ? 'Contratable' : 'No contratable';
  }
}
