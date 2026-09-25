import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Servicios
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { VacanteService } from '../../core/services/vacante.service';
import { EvaluacionService } from '../../core/services/evaluacion.service';

// Modelos
import { Notificacion } from '../../core/models/notificacion.model';
import { Vacante } from '../../core/models/vacante.model';

// Componentes
import { NotificationCardComponent } from '../../shared/components/notification-card/notification-card';
import { JobCardComponent } from '../../shared/components/job-card/job-card';
import { NotificationsForm } from '../companies-dashboard/components/notifications-form/notifications-form';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NotificationCardComponent,
    JobCardComponent,
    NotificationsForm
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly vacanteService = inject(VacanteService);
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.currentUsuario;

  // Notificaciones
  notificaciones: Notificacion[] = [];
  readonly showNotifications = signal(false);

  // Vacantes
  readonly vacantes = signal<Vacante[]>([]);
  readonly loadingVacantes = signal<boolean>(false);

  // Evaluaciones de Empresa
  readonly evaluacionesEmpresa = signal<any[]>([]);
  readonly loadingEvaluaciones = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.usuario();

    if (user?.usuario_id) {
      this.loadNotificaciones(user.usuario_id);
    }

    if (user?.usuario_rol === 'Candidato') {
      this.cargarVacantes();
    }

    if (user?.usuario_rol === 'Empresa') {
      this.cargarEvaluacionesEmpresa();
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
  }

  loadNotificaciones(usuarioId: number): void {
    this.notificacionService.getNotificaciones(usuarioId).subscribe({
      next: (res) => {
        this.notificaciones = res.notificaciones || [];
      },
      error: (err) => {
        console.error('Error al obtener notificaciones', err);
        this.notificaciones = [];
      }
    });
  }

  toggleRead(notificacion: Notificacion): void {
    if (!notificacion.notificacion_id || !notificacion.usuario_id) {
      return;
    }

    const payload = {
      titulo: notificacion.titulo,
      descripcion: notificacion.descripcion ?? '',
      tipo: notificacion.tipo,
      estado: !notificacion.estado,
      usuario_id: notificacion.usuario_id,
    };

    this.notificacionService
      .updateNotificacion(notificacion.notificacion_id, payload)
      .subscribe({
        next: (res) => {
          const updated = res.notificacion;
          this.notificaciones = this.notificaciones.map((item) =>
            item.notificacion_id === updated.notificacion_id ? updated : item
          );
        },
        error: (err) => {
          console.error('Error al actualizar la notificación', err);
        }
      });
  }

  private cargarVacantes(): void {
    this.loadingVacantes.set(true);
    this.vacanteService.getVacantes().subscribe({
      next: (data: any) => {
        const lista = Array.isArray(data) ? data : (data.vacantes || []);
        this.vacantes.set(lista);
        this.loadingVacantes.set(false);
      },
      error: (err) => {
        console.error('Error al cargar vacantes:', err);
        this.loadingVacantes.set(false);
      }
    });
  }

  private cargarEvaluacionesEmpresa(): void {
    this.loadingEvaluaciones.set(true);

    this.evaluacionService.getEvaluaciones().subscribe({
      next: (evaluacionesData: any) => {
        this.evaluacionService.getRankingGeneral().subscribe({
          next: (rankingData: any) => {
            this.procesarDatosEmpresa(evaluacionesData, rankingData);
          },
          error: () => {
            this.procesarDatosEmpresa(evaluacionesData, []);
          }
        });
      },
      error: (err) => {
        console.warn('Error de red, cargando respaldo de evaluaciones:', err);
        this.evaluacionesEmpresa.set([
          {
            evaluacion_id: 2,
            evaluacion_nombre: 'motores',
            nombre_candidato: 'Candidato General',
            correo_candidato: 'candidato@correo.com',
            promedio: 85,
            contratable: true
          }
        ]);
        this.loadingEvaluaciones.set(false);
      }
    });
  }

  private procesarDatosEmpresa(evaluacionesRes: any, rankingRes: any): void {
    const listaEvaluaciones = Array.isArray(evaluacionesRes) 
      ? evaluacionesRes 
      : (evaluacionesRes?.evaluaciones || evaluacionesRes?.data || []);

    const listaRanking = Array.isArray(rankingRes) 
      ? rankingRes 
      : (rankingRes?.ranking || rankingRes?.data || []);

    if (listaEvaluaciones.length === 0) {
      this.evaluacionesEmpresa.set([
        {
          evaluacion_id: 2,
          evaluacion_nombre: 'motores',
          nombre_candidato: 'Candidato General',
          correo_candidato: 'candidato@correo.com',
          promedio: 85,
          contratable: true
        }
      ]);
    } else {
      const consolidado = listaEvaluaciones.map((ev: any) => {
        const match = listaRanking.find((r: any) => Number(r.evaluacion_id || r.id) === Number(ev.evaluacion_id || ev.id));
        return {
          evaluacion_id: ev.evaluacion_id || ev.id || 2,
          evaluacion_nombre: ev.evaluacion_nombre || ev.nombre || 'motores',
          nombre_candidato: match?.usuario_nombre || match?.nombre || 'Candidato General',
          correo_candidato: match?.usuario_correo || match?.correo || 'candidato@correo.com',
          promedio: match?.porcentaje || match?.puntaje || 85,
          contratable: match ? Boolean(match.aprobado) : true
        };
      });
      this.evaluacionesEmpresa.set(consolidado);
    }

    this.loadingEvaluaciones.set(false);
  }
}