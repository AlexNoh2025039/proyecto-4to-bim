import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolUsuario, Usuario } from '../../../../core/models/auth.model';
import { UsuarioService } from '../../../../core/services/usuario.service';

@Component({
  selector: 'app-admin-users-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './admin-users-form.css',
  templateUrl: './admin-users-form.html',
})
export class AdminUsersForm implements OnInit {
  @Input() usuarioToEdit: Usuario | null = null;
  @Output() saveUsuario = new EventEmitter<Usuario>();
  @Output() cancel = new EventEmitter<void>();

  userForm!: FormGroup;
  submitting = false;
  serverError = '';

  readonly roles: RolUsuario[] = ['Administrador', 'Empresa', 'Candidato'];

  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);

  ngOnInit(): void {
    this.initForm();

    if (this.usuarioToEdit) {
      this.userForm.patchValue({
        usuario_id: this.usuarioToEdit.usuario_id,
        usuario_nombre: this.usuarioToEdit.usuario_nombre,
        usuario_apellido: this.usuarioToEdit.usuario_apellido,
        usuario_correo: this.usuarioToEdit.usuario_correo,
        usuario_telefono: this.usuarioToEdit.usuario_telefono ?? '',
        usuario_dpi: this.usuarioToEdit.usuario_dpi ?? '',
        usuario_profesion: this.usuarioToEdit.usuario_profesion ?? '',
        usuario_rol: this.usuarioToEdit.usuario_rol,
        estado: this.usuarioToEdit.estado ?? true,
      });
    }
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      usuario_id: [null],
      usuario_nombre: ['', [Validators.required, Validators.maxLength(50)]],
      usuario_apellido: ['', [Validators.required, Validators.maxLength(50)]],
      usuario_correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      usuario_telefono: ['', [Validators.maxLength(20)]],
      usuario_dpi: ['', [Validators.maxLength(20)]],
      usuario_profesion: ['', [Validators.maxLength(100)]],
      usuario_rol: ['Candidato', [Validators.required]],
      estado: [true, [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const value = this.userForm.getRawValue();

    const payload = {
      usuario_nombre: value.usuario_nombre.trim(),
      usuario_apellido: value.usuario_apellido.trim(),
      usuario_correo: value.usuario_correo.trim().toLowerCase(),
      usuario_telefono: value.usuario_telefono?.trim() || null,
      usuario_dpi: value.usuario_dpi?.trim() || null,
      usuario_profesion: value.usuario_profesion?.trim() || null,
      usuario_rol: value.usuario_rol as RolUsuario,
      estado: value.estado,
    };

    if (!this.usuarioToEdit) {
      this.serverError = 'La creación de usuarios se maneja desde el flujo principal del administrador. Usa el listado principal para agregar o editar usuarios.';
      this.submitting = false;
      return;
    }

    this.serverError = '';
    this.submitting = true;

    this.usuarioService.actualizarUsuario(this.usuarioToEdit.usuario_id, payload).subscribe({
      next: (res) => {
        this.saveUsuario.emit(res.usuario);
        this.submitting = false;
        this.userForm.reset({
          usuario_id: null,
          usuario_nombre: '',
          usuario_apellido: '',
          usuario_correo: '',
          usuario_telefono: '',
          usuario_dpi: '',
          usuario_profesion: '',
          usuario_rol: 'Candidato',
          estado: true,
        });
      },
      error: (err: any) => {
        this.submitting = false;
        this.serverError = err?.error?.message || 'No se pudo guardar el usuario.';
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
