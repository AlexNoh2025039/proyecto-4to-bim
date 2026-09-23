import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Empresa } from '../../../../core/models/empresa.model';
import { Evaluacion } from '../../../../core/models/evaluacion.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { EvaluacionService } from '../../../../core/services/evaluacion.service';

@Component({
  selector: 'app-companies-evaluations',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './companies-evaluations.css',
  templateUrl: './companies-evaluations.html',
})
export class CompaniesEvaluations implements OnInit {
  evaluaciones: Evaluacion[] = [];
  empresas: Empresa[] = [];
  loading = false;
  error = '';

  private readonly empresaService = inject(EmpresaService);
  private readonly evaluacionService = inject(EvaluacionService);

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.empresas = Array.isArray(res.empresas) ? res.empresas : [];
        this.loadEvaluaciones();
      },
      error: () => {
        this.empresas = [];
        this.loadEvaluaciones();
      },
    });
  }

  loadEvaluaciones(): void {
    this.loading = true;
    this.error = '';

    this.evaluacionService.getEvaluaciones().subscribe({
      next: (items) => {
        const empresaIds = new Set((this.empresas || []).map((empresa) => empresa.empresa_id).filter((id): id is number => !!id));
        this.evaluaciones = items.filter((item) => empresaIds.has(item.empresa_id));
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las evaluaciones.';
        this.loading = false;
      },
    });
  }

  getEmpresaNombre(empresaId: number): string {
    return this.empresas.find((empresa) => empresa.empresa_id === empresaId)?.empresa_nombre ?? 'Empresa sin nombre';
  }
}
