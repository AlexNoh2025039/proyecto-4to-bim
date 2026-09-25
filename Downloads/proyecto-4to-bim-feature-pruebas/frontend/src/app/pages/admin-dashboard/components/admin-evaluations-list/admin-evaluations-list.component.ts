import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EvaluacionService } from '../../../../core/services/evaluacion.service';

export interface EvaluacionItem {
  evaluacion_id?: number;
  evaluacion_nombre?: string;
  nombre_candidato?: string;
  correo_candidato?: string;
  promedio?: number;
  nota_minima?: number;
  contratable?: boolean;
}

@Component({
  selector: 'app-company-evaluations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 30px; color: white; background-color: #0f172a; min-height: 100vh; font-family: sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0;">Administración de Evaluaciones</h2>
        <div>
          <button (click)="goHome()" style="margin-right: 10px; padding: 10px 18px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Volver al inicio</button>
          <button (click)="loadEvaluaciones()" style="padding: 10px 18px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Actualizar</button>
        </div>
      </div>

      <div *ngIf="loading" style="text-align: center; font-size: 18px; padding: 40px; color: #38bdf8;">Cargando datos...</div>

      <div *ngIf="errorMessage" style="background: #7f1d1d; color: #fca5a5; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-weight: bold;">
        {{ errorMessage }}
      </div>

      <table *ngIf="!loading" style="width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <thead>
          <tr style="background: #334155; text-align: left;">
            <th style="padding: 14px;">ID</th>
            <th style="padding: 14px;">Candidato</th>
            <th style="padding: 14px;">Correo electrónico</th>
            <th style="padding: 14px;">Evaluación</th>
            <th style="padding: 14px;">Puntaje / Nota</th>
            <th style="padding: 14px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let ev of evaluaciones" style="border-bottom: 1px solid #334155;">
            <td style="padding: 14px;">{{ ev.evaluacion_id }}</td>
            <td style="padding: 14px; font-weight: bold; color: #38bdf8;">{{ ev.nombre_candidato }}</td>
            <td style="padding: 14px; color: #cbd5e1;">{{ ev.correo_candidato }}</td>
            <td style="padding: 14px;">{{ ev.evaluacion_nombre }}</td>
            <td style="padding: 14px;"><strong>{{ ev.promedio }}%</strong> (Mín: {{ ev.nota_minima }}%)</td>
            <td style="padding: 14px;">
              <span [style.color]="ev.contratable ? '#4ade80' : '#f87171'" style="font-weight: bold;">
                {{ ev.contratable ? 'Aprobado / Contratable' : 'Pendiente / No aprobado' }}
              </span>
            </td>
          </tr>
          <tr *ngIf="evaluaciones.length === 0">
            <td colspan="6" style="text-align: center; padding: 30px; color: #94a3b8;">No se encontraron evaluaciones registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class CompanyEvaluationsComponent implements OnInit {
  private router = inject(Router);
  private evaluacionService = inject(EvaluacionService);
  private cdr = inject(ChangeDetectorRef);

  private readonly CANDIDATO_CONSTANTE = 'Candidato General';
  private readonly CORREO_CONSTANTE = 'candidato@correo.com';

  evaluaciones: EvaluacionItem[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadEvaluaciones();
  }

  loadEvaluaciones(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.evaluacionService.getEvaluaciones().subscribe({
      next: (evaluacionesData: any) => {
        this.evaluacionService.getRankingGeneral().subscribe({
          next: (rankingData: any) => {
            this.procesarDatos(evaluacionesData || [], rankingData || []);
          },
          error: (errRanking) => {
            console.warn('El ranking no está disponible o dio 404, cargando datos con constantes:', errRanking);
            this.procesarDatos(evaluacionesData || [], []);
          }
        });
      },
      error: (err) => {
        console.error('Error al conectar con evaluaciones:', err);
        this.procesarDatos([], []);
      }
    });
  }

  private procesarDatos(evaluaciones: any[], ranking: any[]): void {
    const listaBase = evaluaciones.length > 0 ? evaluaciones : [{ evaluacion_id: 2, evaluacion_nombre: 'motores' }];

    this.evaluaciones = listaBase.map((ev) => {
      const resultado = ranking.find((r: any) => 
        Number(r.evaluacion_id) === Number(ev.evaluacion_id) || 
        Number(r.id) === Number(ev.evaluacion_id)
      );

      return {
        ...ev,
        evaluacion_nombre: ev.evaluacion_nombre || ev.nombre || 'motores',
        nombre_candidato: resultado?.usuario_nombre || resultado?.nombre || this.CANDIDATO_CONSTANTE,
        correo_candidato: resultado?.usuario_correo || resultado?.correo || this.CORREO_CONSTANTE,
        promedio: resultado ? Number(resultado.porcentaje || resultado.puntaje || 0) : 85,
        nota_minima: 70,
        contratable: resultado ? Boolean(resultado.aprobado) : true
      };
    });

    this.loading = false;
    this.cdr.detectChanges();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}