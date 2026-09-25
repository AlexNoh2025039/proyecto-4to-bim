import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Usuario } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-candidate-profile-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 30px; color: white; background-color: #0f172a; min-height: 100vh; font-family: sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="margin: 0;">Perfil del Candidato</h2>
        <button routerLink="/admin/evaluaciones" style="padding: 10px 18px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Volver a Evaluaciones</button>
      </div>

      <div *ngIf="candidate; else loadingTpl" style="background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); max-width: 500px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 15px;">
          <div style="background: #3b82f6; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-right: 20px;">
            {{ candidate.usuario_nombre?.charAt(0) || 'U' }}
          </div>
          <div>
            <h3 style="margin: 0; color: #38bdf8; font-size: 22px;">{{ candidate.usuario_nombre }} {{ candidate.usuario_apellido }}</h3>
          </div>
        </div>

        <div style="font-size: 16px;">
          <p style="margin: 0;"><strong>Correo electrónico:</strong><br><span style="color: #cbd5e1; font-size: 18px;">{{ candidate.usuario_correo }}</span></p>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div style="text-align: center; font-size: 18px; padding: 40px; color: #94a3b8;">Cargando perfil...</div>
      </ng-template>
    </div>
  `
})
export class CandidateProfileView implements OnInit {
  candidate: Usuario | null = null;
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id')) || 1;
      this.loadCandidate(id);
    });
  }

  private loadCandidate(id: number): void {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('user') || '{}');
    const resultadosLocales = JSON.parse(localStorage.getItem('evaluacion_resultados') || '[]');
    const ultimoResultado = resultadosLocales[resultadosLocales.length - 1] || {};

    this.candidate = {
      usuario_id: id,
      usuario_nombre: usuarioGuardado.usuario_nombre || usuarioGuardado.nombre || ultimoResultado.nombre || 'Usuario',
      usuario_apellido: usuarioGuardado.usuario_apellido || usuarioGuardado.apellido || ultimoResultado.apellido || 'Registrado',
      usuario_correo: usuarioGuardado.usuario_correo || usuarioGuardado.correo || ultimoResultado.correo || 'No proporcionado'
    } as any;
  }
}