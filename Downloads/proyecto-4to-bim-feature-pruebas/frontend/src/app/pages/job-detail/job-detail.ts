import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Vacante, VacanteResponse } from '../../core/models/vacante.model';
import { Empresa, EmpresaResponse } from '../../core/models/empresa.model';
import { Postulacion, PostulacionesResponse } from '../../core/models/postulacion.model';
import { VacanteService } from '../../core/services/vacante.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { PostulacionService } from '../../core/services/postulacion.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css'
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vacanteService = inject(VacanteService);
  private readonly empresaService = inject(EmpresaService);
  private readonly postulacionService = inject(PostulacionService);

  vacante: Vacante | null = null;
  empresa: Empresa | null = null;
  miPostulacion: Postulacion | null = null;

  loading = true;
  postulando = false;
  errorMsg = '';
  successMsg = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || !Number.isInteger(id) || id <= 0) {
      this.errorMsg = 'ID de vacante no válido.';
      this.loading = false;
      return;
    }

    this.cargarVacante(id);
  }

  cargarVacante(id: number): void {
    this.loading = true;
    this.errorMsg = '';

    this.vacanteService.getVacanteById(id).subscribe({
      next: (res: VacanteResponse) => {
        this.vacante = res.vacante;
        this.cargarEmpresa(this.vacante.empresa_id);
        this.verificarPostulacionExistente(id);
      },
      error: (err) => {
        console.error('Error al cargar la vacante', err);
        this.errorMsg = err?.error?.message || 'No se encontró la vacante solicitada.';
        this.loading = false;
      }
    });
  }

  cargarEmpresa(empresa_id: number): void {
    this.empresaService.getEmpresaById(empresa_id).subscribe({
      next: (res: EmpresaResponse) => {
        this.empresa = res.empresa;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la empresa', err);
        this.loading = false;
      }
    });
  }

  verificarPostulacionExistente(vacante_id: number): void {
    this.postulacionService.getPostulaciones().subscribe({
      next: (res: PostulacionesResponse) => {
        const propias = res.postulaciones || [];
        this.miPostulacion = propias.find(p => p.vacante_id === vacante_id) || null;
      },
      error: (err) => {
        console.error('Error al verificar postulaciones existentes', err);
      }
    });
  }

  postularme(): void {
    if (!this.vacante?.vacante_id || this.postulando || this.miPostulacion) {
      return;
    }

    this.errorMsg = '';
    this.successMsg = '';
    this.postulando = true;

    this.postulacionService.postPostulacion({ vacante_id: this.vacante.vacante_id }).subscribe({
      next: (res) => {
        this.miPostulacion = res.postulacion;
        this.successMsg = 'Te has postulado correctamente a esta vacante.';
        this.postulando = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'No se pudo registrar tu postulación.';
        this.postulando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/home']);
  }
}