import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Servicios
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { VacanteService } from '../../core/services/vacante.service';

// Modelos
import { Notificacion } from '../../core/models/notificacion.model';
import { Vacante } from '../../core/models/vacante.model';

// Componentes
import { NotificationCardComponent } from '../../shared/components/notification-card/notification-card';
import { JobCardComponent } from '../../shared/components/job-card/job-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NotificationCardComponent,
    JobCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly vacanteService = inject(VacanteService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.currentUsuario;

  // Estado para notificaciones
  notificaciones: Notificacion[] = [];
  readonly showNotifications = signal(false);

  // Estado para vacantes
  readonly vacantes = signal<Vacante[]>([]);
  readonly loadingVacantes = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.usuario();

    if (user?.usuario_id) {
      this.loadNotificaciones(user.usuario_id);
    }

    if (user?.usuario_rol === 'Candidato') {
      this.cargarVacantes();
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
}