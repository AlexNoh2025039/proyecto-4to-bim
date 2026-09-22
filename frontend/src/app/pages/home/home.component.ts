<<<<<<< HEAD
import { Component, inject, OnInit } from '@angular/core';
=======
import { Component, OnInit, inject, signal } from '@angular/core';
>>>>>>> c64110f124ed8e2453d4905e724ab3e37170253c
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
<<<<<<< HEAD
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/notificacion.model';
import { NotificationCardComponent } from '../../shared/components/notification-card/notification-card';

@Component({
  imports: [CommonModule, NotificationCardComponent],
  selector: 'app-home.component',
  styleUrl: './home.component.css',
=======
import { VacanteService } from '../../core/services/vacante.service';
import { Vacante } from '../../core/models/vacante.model';

// Componente reutilizable del paquete compartido
import { JobCardComponent } from '../../shared/components/job-card/job-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, JobCardComponent],
>>>>>>> c64110f124ed8e2453d4905e724ab3e37170253c
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
<<<<<<< HEAD
  private readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);

=======
  protected readonly authService = inject(AuthService);
  private readonly vacanteService = inject(VacanteService);

  // Obtiene el signal del usuario actual desde AuthService
>>>>>>> c64110f124ed8e2453d4905e724ab3e37170253c
  readonly usuario = this.authService.currentUsuario;
  notificaciones: Notificacion[] = [];

  ngOnInit(): void {
    const user = this.usuario();
    if (user?.usuario_id) {
      this.loadNotificaciones(user.usuario_id);
    }
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

  readonly vacantes = signal<Vacante[]>([]);
  readonly loadingVacantes = signal<boolean>(false);

  ngOnInit(): void {
    const role = this.usuario()?.usuario_rol;

    if (role === 'Candidato') {
      this.cargarVacantes();
    }
  }

  private cargarVacantes(): void {
    this.loadingVacantes.set(true);
    this.vacanteService.getVacantes().subscribe({
      next: (data) => {
        this.vacantes.set(data.vacantes);
        this.loadingVacantes.set(false);
      },
      error: (err) => {
        console.error('Error al cargar vacantes:', err);
        this.loadingVacantes.set(false);
      }
    });
  }
}