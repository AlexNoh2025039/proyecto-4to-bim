import { Component,OnInit,inject} from '@angular/core';
import {FormBuilder,ReactiveFormsModule,Validators} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {ActualizarUsuarioRequest,CambiarPasswordRequest,Usuario} from './../../core/models/auth.model';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService =inject(AuthService);
  private readonly router =inject(Router);

  usuario: Usuario | null = null;

  guardandoPerfil = false;
  cambiandoPassword = false;
  guardandoFoto = false;
  eliminandoCuenta = false;

  mensaje = '';
  error = '';

  fotoPreview: string | null = null;

  readonly perfilForm =
    this.fb.nonNullable.group({

      usuario_nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],

      usuario_apellido: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],

      usuario_correo: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(100)
        ]
      ],

      usuario_telefono: [
        '',
        [
          Validators.maxLength(20)
        ]
      ],

      usuario_dpi: [
        '',
        [
          Validators.maxLength(20)
        ]
      ],

      usuario_profesion: [
        '',
        [
          Validators.maxLength(100)
        ]
      ]
    });

  readonly passwordForm =
    this.fb.nonNullable.group({

      usuario_password_actual: [
        '',
        Validators.required
      ],

      usuario_password_nueva: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      confirmar_password: [
        '',
        [
          Validators.required
        ]
      ]
    });

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {

    this.usuarioService
      .obtenerMiPerfil()
      .subscribe({

        next: (response) => {

          this.usuario =
            response.usuario;

          this.perfilForm.patchValue({

            usuario_nombre:
              this.usuario.usuario_nombre,

            usuario_apellido:
              this.usuario.usuario_apellido,

            usuario_correo:
              this.usuario.usuario_correo,

            usuario_telefono:
              this.usuario.usuario_telefono ?? '',

            usuario_dpi:
              this.usuario.usuario_dpi ?? '',

            usuario_profesion:
              this.usuario.usuario_profesion ?? ''
          });

          this.fotoPreview =
            this.usuario.usuario_perfil ?? null;
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo cargar el perfil.';
        }
      });
  }

  guardarPerfil(): void {

    this.mensaje = '';
    this.error = '';

    if (this.perfilForm.invalid) {

      this.perfilForm.markAllAsTouched();

      return;
    }

    const value =
      this.perfilForm.getRawValue();

    const data: ActualizarUsuarioRequest = {

      usuario_nombre:
        value.usuario_nombre.trim(),

      usuario_apellido:
        value.usuario_apellido.trim(),

      usuario_correo:
        value.usuario_correo
          .trim()
          .toLowerCase(),

      usuario_telefono:
        value.usuario_telefono.trim() || null,

      usuario_dpi:
        value.usuario_dpi.trim(),

      usuario_profesion:
        value.usuario_profesion.trim() || null
    };

    this.guardandoPerfil = true;

    this.usuarioService
      .actualizarMiPerfil(data)
      .pipe(
        finalize(() => {
          this.guardandoPerfil = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.usuario =
            response.usuario;

          try {

            this.authService.updateCurrentUsuario({
              ...response.usuario,
              usuario_perfil: null
            });

          } catch (error) {

            console.warn(
              'No se pudo actualizar el usuario en la sesión:',
              error
            );
          }

          this.mensaje =
            response.message ||
            'Perfil actualizado correctamente.';
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo actualizar el perfil.';
        }
      });
  }

  // =====================================================
  // FOTO
  // =====================================================

  seleccionarFoto(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    if (!file.type.startsWith('image/')) {

      this.error =
        'Selecciona una imagen válida.';

      input.value = '';

      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      this.error =
        'La imagen no puede superar los 5 MB.';

      input.value = '';

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      const result =
        reader.result;

      if (typeof result === 'string') {

        this.fotoPreview = result;
      }
    };

    reader.readAsDataURL(file);
  }

  guardarFoto(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.fotoPreview) {

      this.error =
        'Selecciona una imagen primero.';

      return;
    }

    this.guardandoFoto = true;

    this.usuarioService
      .actualizarFotoPerfil(this.fotoPreview)
      .pipe(
        finalize(() => {
          this.guardandoFoto = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.usuario =
            response.usuario;

          this.fotoPreview =
            response.usuario.usuario_perfil ?? null;

          /*
           * No guardamos la imagen Base64
           * dentro de la sesión.
           */
          try {

            this.authService.updateCurrentUsuario({
              ...response.usuario,
              usuario_perfil: null
            });

          } catch (error) {

            console.warn(
              'No se pudo actualizar el usuario en la sesión:',
              error
            );
          }

          this.mensaje =
            response.message ||
            'Foto de perfil actualizada correctamente.';
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo actualizar la foto.';
        }
      });
  }

  eliminarFoto(): void {

    this.mensaje = '';
    this.error = '';

    this.guardandoFoto = true;

    this.usuarioService
      .actualizarFotoPerfil(null)
      .pipe(
        finalize(() => {
          this.guardandoFoto = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.usuario =
            response.usuario;

          this.fotoPreview = null;

          try {

            this.authService.updateCurrentUsuario({
              ...response.usuario,
              usuario_perfil: null
            });

          } catch (error) {

            console.warn(
              'No se pudo actualizar el usuario en la sesión:',
              error
            );
          }

          this.mensaje =
            response.message ||
            'Foto de perfil eliminada correctamente.';
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo eliminar la foto.';
        }
      });
  }

  // =====================================================
  // PASSWORD
  // =====================================================

  cambiarPassword(): void {

    this.mensaje = '';
    this.error = '';

    if (this.passwordForm.invalid) {

      this.passwordForm.markAllAsTouched();

      return;
    }

    const value =
      this.passwordForm.getRawValue();

    if (
      value.usuario_password_nueva !==
      value.confirmar_password
    ) {

      this.error =
        'Las contraseñas nuevas no coinciden.';

      return;
    }

    const data: CambiarPasswordRequest = {

      usuario_password_actual:
        value.usuario_password_actual,

      usuario_password_nueva:
        value.usuario_password_nueva
    };

    this.cambiandoPassword = true;

    this.usuarioService
      .cambiarMiPassword(data)
      .pipe(
        finalize(() => {
          this.cambiandoPassword = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.mensaje =
            response.message;

          this.passwordForm.reset();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo cambiar la contraseña.';
        }
      });
  }

  // =====================================================
  // ELIMINAR CUENTA
  // =====================================================

  eliminarCuenta(): void {

    const confirmar =
      window.confirm(
        '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.'
      );

    if (!confirmar) {
      return;
    }

    this.eliminandoCuenta = true;

    this.usuarioService
      .eliminarMiCuenta()
      .subscribe({

        next: () => {

          this.authService.clearSession();

          this.router.navigate([
            '/login'
          ]);
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo eliminar la cuenta.';

          this.eliminandoCuenta = false;
        }
      });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  get iniciales(): string {

    if (!this.usuario) {
      return '?';
    }

    const nombre =
      this.usuario.usuario_nombre
        ?.charAt(0) || '';

    const apellido =
      this.usuario.usuario_apellido
        ?.charAt(0) || '';

    return (
      nombre +
      apellido
    ).toUpperCase();
  }
}