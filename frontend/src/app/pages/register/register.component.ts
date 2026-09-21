import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RolUsuario } from '../../core/models/auth.model';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-register.component',
  styleUrl: './register.component.css',
  templateUrl: './register.component.html',
})

export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  registerForm = this.fb.nonNullable.group({
    usuario_nombre: ['', [Validators.required, Validators.maxLength(50)]],
    usuario_apellido: ['', [Validators.required, Validators.maxLength(50)]],
    usuario_correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    usuario_password: ['', [Validators.required, Validators.minLength(6)]],
    usuario_rol: ['Candidato' as RolUsuario, Validators.required], // Tipado exacto según tu modelo
    usuario_telefono: ['', Validators.maxLength(20)],
    usuario_dpi: ['', Validators.maxLength(20)],
    usuario_profesion: ['', Validators.maxLength(100)]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Error detallado de registro:', err);
        this.errorMessage.set(err.error?.message || 'Hubo un error al registrar el usuario.');
      }
    });
  }
}