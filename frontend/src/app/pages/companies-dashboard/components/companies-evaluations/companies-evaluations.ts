import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RespuestaEvaluacionService } from '../../../../core/services/respuesta-evaluacion.service';
import { RankingEvaluacion } from '../../../../core/models/respuesta-evaluacion.model';

@Component({
  selector: 'app-companies-evaluations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './companies-evaluations.html'
})
export class CompaniesEvaluations implements OnInit {
  private readonly router = inject(Router);
  private readonly respuestaEvaluacionService = inject(RespuestaEvaluacionService);

  private readonly NOTA_MINIMA = 70;

  ranking: RankingEvaluacion[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadRanking();
  }

  loadRanking(): void {
    this.loading = true;
    this.errorMessage = '';

    this.respuestaEvaluacionService.getRanking().subscribe({
      next: (data) => {
        this.ranking = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo cargar el ranking de tus evaluaciones.';
        this.loading = false;
      }
    });
  }

  esAprobado(item: RankingEvaluacion): boolean {
    return item.promedio >= this.NOTA_MINIMA;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}