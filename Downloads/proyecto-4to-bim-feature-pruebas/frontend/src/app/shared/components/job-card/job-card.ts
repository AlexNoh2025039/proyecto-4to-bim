import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Vacante } from '../../../core/models/vacante.model';
import { PostulacionService } from '../../../core/services/postulacion.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-card.html',
  styleUrl: './job-card.css'
})
export class JobCardComponent {
  @Input({ required: true }) vacante!: Vacante;
  @Input() isCompanyOwner: boolean = false;

  @Output() edit = new EventEmitter<Vacante>();
  @Output() delete = new EventEmitter<number>();

  private readonly postulacionService = inject(PostulacionService);
  private readonly authService = inject(AuthService);

  postulando = false;

  onEdit(): void {
    this.edit.emit(this.vacante);
  }

  onDelete(): void {
    if (this.vacante.vacante_id) {
      this.delete.emit(this.vacante.vacante_id);
    }
  }

  // MÉTODO PARA QUE EL CANDIDATO SE POSTULE
  onPostularme(): void {
    const user = this.authService.currentUsuario();
    if (!user || !this.vacante.vacante_id) {
      alert('Debes iniciar sesión para postularte.');
      return;
    }

    this.postulando = true;

    const payload = {
      vacante_id: this.vacante.vacante_id,
      usuario_id: user.usuario_id,
      estado: 'Pendiente'
    };

    this.postulacionService.postPostulacion(payload as any).subscribe({
      next: () => {
        alert('¡Te has postulado exitosamente a esta vacante!');
        this.postulando = false;
      },
      error: (err) => {
        alert('No se pudo enviar la postulación: ' + (err?.error?.message || 'Error'));
        this.postulando = false;
      }
    });
  }
}