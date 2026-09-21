import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VacanteService } from '../../core/services/vacante.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Vacante } from '../../core/models/vacante.model';
import { Empresa } from '../../core/models/empresa.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css'
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly vacanteService = inject(VacanteService);
  private readonly empresaService = inject(EmpresaService);

  vacante: Vacante | null = null;
  empresa: Empresa | null = null;
  loading: boolean = true;
  errorMsg: string = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.getVacanteDetail(id);
    } else {
      this.errorMsg = 'ID de vacante no valido.';
      this.loading = false;
    }
  }

  getVacanteDetail(id: number): void {
    this.vacanteService.getVacanteById(id).subscribe({
      next: (res) => {
        this.vacante = res.vacante;
        if (this.vacante && this.vacante.empresa_id) {
          this.getEmpresaDetail(this.vacante.empresa_id);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle de vacante', err);
        this.errorMsg = 'No se encontro la vacante solicitada.';
        this.loading = false;
      }
    });
  }

  getEmpresaDetail(empresaId: number): void {
    this.empresaService.getEmpresaById(empresaId).subscribe({
      next: (res) => {
        this.empresa = res.empresa;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle de empresa', err);
        this.loading = false;
      }
    });
  }
}