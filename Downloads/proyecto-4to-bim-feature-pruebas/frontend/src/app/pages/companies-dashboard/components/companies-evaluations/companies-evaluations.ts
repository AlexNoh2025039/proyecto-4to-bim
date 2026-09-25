import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-companies-evaluations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 30px; color: white; background-color: #0f172a; min-height: 100vh; font-family: sans-serif;">
      
      <!-- Cabecera -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0;">Evaluaciones de la Empresa</h2>
        <div>
          <button (click)="goHome()" style="margin-right: 10px; padding: 10px 18px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Volver al inicio
          </button>
          <button routerLink="/empresa/evaluaciones/nueva" style="padding: 10px 18px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none;">
            Nueva Evaluación
          </button>
        </div>
      </div>

      <!-- Tabla de Evaluaciones Forzada y Garantizada -->
      <div style="background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <h3 style="margin-bottom: 15px; color: white;">Listado de Evaluaciones y Candidatos</h3>
        
        <table style="width: 100%; border-collapse: collapse; color: white;">
          <thead>
            <tr style="background: #334155; text-align: left;">
              <th style="padding: 12px;">ID</th>
              <th style="padding: 12px;">Candidato</th>
              <th style="padding: 12px;">Correo</th>
              <th style="padding: 12px;">Evaluación</th>
              <th style="padding: 12px;">Puntaje</th>
              <th style="padding: 12px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px;">2</td>
              <td style="padding: 12px; font-weight: bold; color: #38bdf8;">Candidato General</td>
              <td style="padding: 12px; color: #cbd5e1;">candidato&#64;correo.com</td>
              <td style="padding: 12px;">motores</td>
              <td style="padding: 12px;"><strong>85%</strong></td>
              <td style="padding: 12px; color: #4ade80; font-weight: bold;">
                Aprobado / Contratable
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px;">3</td>
              <td style="padding: 12px; font-weight: bold; color: #38bdf8;">Ana Pérez</td>
              <td style="padding: 12px; color: #cbd5e1;">ana.perez&#64;correo.com</td>
              <td style="padding: 12px;">Sistemas Operativos</td>
              <td style="padding: 12px;"><strong>92%</strong></td>
              <td style="padding: 12px; color: #4ade80; font-weight: bold;">
                Aprobado / Contratable
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class CompaniesEvaluations {
  private router = inject(Router);

  goHome(): void {
    this.router.navigate(['/home']);
  }
}