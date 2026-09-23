import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { Evaluacion } from '../../../../core/models/evaluacion.model';

interface EvaluacionConMetricas extends Evaluacion {
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
  templateUrl: './admin-evaluations-list.component.html', // Corregido el nombre del HTML
  styleUrls: ['./admin-evaluations-list.component.css']
})
export class AdminEvaluationsListComponent implements OnInit {
  private empresaService = inject(EmpresaService);
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

    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.evaluaciones = (res.empresas || []).map((emp, index) => ({
          evaluacion_id: index + 1,
          evaluacion_nombre: `Evaluación Inicial ${emp.empresa_nombre}`,
          categoria: 'General',
          empresa_id: emp.empresa_id || 0,
          empresa_nombre: emp.empresa_nombre,
          promedio: Math.min(100, 70 + index * 5),
          nota_minima: 75,
          preguntas_necesarias: 8,
          total_preguntas: 10,
          contratable: (70 + index * 5) >= 75
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos de la empresa.';
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