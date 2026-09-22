import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/notificacion.model';
import { NotificationCardComponent } from '../../shared/components/notification-card/notification-card';

@Component({
  imports: [CommonModule, NotificationCardComponent],
  selector: 'app-home.component',
  styleUrl: './home.component.css',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);

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

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}