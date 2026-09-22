import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-login.component',
  styleUrl: './login.component.css',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  loginForm = this.fb.nonNullable.group({
    usuario_correo: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]
    ],
    usuario_password: [
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ]
  });

  onSubmit(): void {
    this.errorMessage.set('');
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const values = this.loginForm.getRawValue();

    this.authService.login({
      usuario_correo: values.usuario_correo,
      usuario_password: values.usuario_password
    }).subscribe({
      next: () => {
        this.router.navigateByUrl('/home');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Error en login:', err);
        this.errorMessage.set(
          err.error?.message || 'Correo o contraseña incorrectos.'
        );
      }
    });
  }
}