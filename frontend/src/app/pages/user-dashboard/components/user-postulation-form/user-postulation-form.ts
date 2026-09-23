import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Postulacion, PostulacionesResponse } from '../../../../core/models/postulacion.model';
import { PostulacionService } from '../../../../core/services/postulacion.service';

@Component({
  selector: 'app-user-postulation-form',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-postulation-form.html',
  styleUrl: './user-postulation-form.css'
})
export class UserPostulationForm implements OnInit {
  private readonly postulacionService = inject(PostulacionService);

  postulaciones: Postulacion[] = [];
  cargando = false;
  cancelando = false;
  mensaje = '';
  error = '';

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  cargarPostulaciones(): void {
    this.cargando = true;
    this.error = '';

    this.postulacionService.getPostulaciones().subscribe({
      next: (response: PostulacionesResponse) => {
        this.postulaciones = response.postulaciones || [];
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar tus postulaciones.';
        this.cargando = false;
      }
    });
  }

  puedeCancelar(postulacion: Postulacion): boolean {
    return postulacion.estado !== 'Rechazado' && postulacion.estado !== 'Aceptado';
  }

  cancelarPostulacion(postulacion: Postulacion): void {
    if (!postulacion.postulacion_id || !this.puedeCancelar(postulacion)) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas cancelar tu postulación a "${postulacion.vacante_nombre}"?`
    );

    if (!confirmar) return;

    this.mensaje = '';
    this.error = '';
    this.cancelando = true;

    this.postulacionService.putPostulacion(postulacion.postulacion_id, {
      vacante_id: postulacion.vacante_id,
      estado: 'Rechazado'
    }).subscribe({
      next: (response) => {
        this.postulaciones = this.postulaciones.map(p =>
          p.postulacion_id === response.postulacion.postulacion_id
            ? { ...p, estado: response.postulacion.estado }
            : p
        );
        this.mensaje = 'Postulación cancelada correctamente.';
        this.cancelando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cancelar la postulación.';
        this.cancelando = false;
      }
    });
  }
}