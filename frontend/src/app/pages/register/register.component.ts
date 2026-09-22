import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
    tipoRegistro: this.fb.nonNullable.control<'Candidato' | 'Empresa'>('Candidato'),
    usuario_nombre: ['', [Validators.required, Validators.maxLength(50)]],
    usuario_apellido: ['', [Validators.required, Validators.maxLength(50)]],
    usuario_correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    usuario_password: ['', [Validators.required, Validators.minLength(6)]],
    usuario_dpi: ['', [Validators.maxLength(20)]],
    usuario_telefono: ['', [Validators.maxLength(20)]],
    usuario_profesion: ['', [Validators.maxLength(100)]],
    empresa_nombre: ['', [Validators.maxLength(100)]],
    empresa_descripcion: [''],
    empresa_correo: ['', [Validators.maxLength(100)]],
    empresa_telefono: ['', [Validators.maxLength(20)]],
    empresa_nit: ['', [Validators.maxLength(30)]],
    empresa_direccion: ['', [Validators.maxLength(250)]]
  });

  constructor() {
    this.cambiarTipoRegistro();
  }

  cambiarTipoRegistro(): void {
    const tipo = this.registerForm.controls.tipoRegistro.value;
    const empresaNombre = this.registerForm.controls.empresa_nombre;
    const empresaCorreo = this.registerForm.controls.empresa_correo;

    if (tipo === 'Empresa') {
      empresaNombre.setValidators([Validators.required, Validators.maxLength(100)]);
      empresaCorreo.setValidators([Validators.required, Validators.email, Validators.maxLength(100)]);
    } else {
      empresaNombre.setValidators([Validators.maxLength(100)]);
      empresaCorreo.setValidators([Validators.maxLength(100)]);
    }

    empresaNombre.updateValueAndValidity();
    empresaCorreo.updateValueAndValidity();
  }

  isEmpresa(): boolean {
    return this.registerForm.controls.tipoRegistro.value === 'Empresa';
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const values = this.registerForm.getRawValue();

    if (values.tipoRegistro === 'Candidato') {
      this.authService.registerCandidate({
        usuario_nombre: values.usuario_nombre,
        usuario_apellido: values.usuario_apellido,
        usuario_correo: values.usuario_correo,
        usuario_password: values.usuario_password,
        usuario_dpi: values.usuario_dpi || undefined,
        usuario_telefono: values.usuario_telefono || undefined,
        usuario_profesion: values.usuario_profesion || undefined
      }).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          console.error('Error registrando candidato:', err);
          this.errorMessage.set(err.error?.message || 'No se pudo registrar el usuario.');
        }
      });
      return;
    }

    this.authService.registerEmpresa({
      usuario_nombre: values.usuario_nombre,
      usuario_apellido: values.usuario_apellido,
      usuario_correo: values.usuario_correo,
      usuario_password: values.usuario_password,
      usuario_dpi: values.usuario_dpi || undefined,
      usuario_telefono: values.usuario_telefono || undefined,
      usuario_profesion: values.usuario_profesion || undefined,
      empresa_nombre: values.empresa_nombre,
      empresa_descripcion: values.empresa_descripcion || undefined,
      empresa_correo: values.empresa_correo,
      empresa_telefono: values.empresa_telefono || undefined,
      empresa_nit: values.empresa_nit || undefined,
      empresa_direccion: values.empresa_direccion || undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Error registrando empresa:', err);
        this.errorMessage.set(err.error?.message || 'No se pudo registrar la empresa.');
      }
    });
  }
}