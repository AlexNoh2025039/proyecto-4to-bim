import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificacionService } from '../../../../core/services/notificacion.service';

@Component({
  selector: 'app-notifications-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './notifications-form.css',
  templateUrl: './notifications-form.html',
})
export class NotificationsForm {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificacionService);

  form = this.fb.group({
    usuario_id: [null, [Validators.required, Validators.min(1)]],
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required]],
    tipo: ['Informativo', [Validators.required, Validators.maxLength(50)]],
    estado: [false]
  });

  sending = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    this.successMessage = null;
    this.errorMessage = null;

    const payload = {
      usuario_id: Number(this.form.value.usuario_id),
      titulo: this.form.value.titulo ?? '',
      descripcion: this.form.value.descripcion ?? '',
      tipo: this.form.value.tipo ?? 'Informativo',
      estado: Boolean(this.form.value.estado)
    };

    this.notificationService.createNotificacion(payload).subscribe({
      next: () => {
        this.successMessage = 'Notificación enviada por administración.';
        this.form.reset({
          tipo: 'Informativo',
          estado: false
        });
        this.sending = false;
      },
      error: (err) => {
        this.errorMessage = 'No se pudo enviar la notificación.';
        console.error(err);
        this.sending = false;
      }
    });
  }
}
