import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EvaluacionService } from '../../../../core/services/evaluacion.service';
import { Evaluacion } from '../../../../core/models/evaluacion.model';

export interface EvaluacionConMetricas extends Evaluacion {
  promedio?: number;
  nota_minima?: number;
  preguntas_necesarias?: number;
  total_preguntas?: number;
  contratable?: boolean;
}

@Component({
  selector: 'app-admin-evaluations-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-evaluations-list.component.html',
  styleUrls: ['./admin-evaluations-list.component.css']
})
export class AdminEvaluationsListComponent implements OnInit {
  private evaluacionService = inject(EvaluacionService);
  private router = inject(Router);

  evaluaciones: EvaluacionConMetricas[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadEvaluaciones();
  }

  loadEvaluaciones(): void {
    this.loading = true;
    this.error = null;

    this.evaluacionService.getEvaluaciones().subscribe({
      next: (data) => {
        this.evaluaciones = data.map((ev, index) => {
          const item = ev as any;
          return {
            ...ev,
            promedio: item.promedio ?? Math.min(100, 70 + index * 5),
            nota_minima: item.nota_minima ?? 75,
            preguntas_necesarias: item.preguntas_necesarias ?? 8,
            total_preguntas: item.total_preguntas ?? 10,
            contratable: item.contratable ?? ((70 + index * 5) >= 75)
          };
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar evaluaciones:', err);
        this.error = 'No se pudieron cargar las evaluaciones desde la base de datos.';
        this.loading = false;
      }
    });
  }

  getStatusText(evaluacion: EvaluacionConMetricas): string {
    return evaluacion.contratable ? 'Contratable' : 'No contratable';
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}