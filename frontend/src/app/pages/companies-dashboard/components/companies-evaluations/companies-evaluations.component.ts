import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { Evaluacion } from '../../../../core/models/evaluacion.model';

@Component({
  selector: 'app-companies-evaluations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './companies-evaluations.component.html',
  styleUrls: ['./companies-evaluations.component.css']
})
export class CompaniesEvaluationsComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private router = inject(Router);

  evaluaciones: Evaluacion[] = [];
  empresas: Empresa[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.loading = true;
    this.error = null;

    // Se consume el servicio real extrayendo la propiedad 'empresas' de EmpresasResponse
    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.empresas = res.empresas || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Ocurrió un error al cargar la información.';
        this.loading = false;
      }
    });
  }

  getEmpresaNombre(empresaId: number): string {
    const empresa = this.empresas.find(e => e.empresa_id === empresaId);
    return empresa ? empresa.empresa_nombre : 'Desconocida';
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}