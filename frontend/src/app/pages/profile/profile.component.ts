import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ActualizarUsuarioRequest,
  CambiarPasswordRequest,
  Usuario
} from './../../core/models/auth.model';

import {
  UsuarioService
} from '../../core/services/usuario.service';

import {
  AuthService
} from '../../core/services/auth.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;

  guardandoPerfil = false;
  cambiandoPassword = false;
  guardandoFoto = false;
  eliminandoCuenta = false;

  mensaje = '';
  error = '';

  fotoPreview: string | null = null;

  /**
   * Indica si la foto actual ya fue guardada en el servidor.
   *
   * false = mostrar botón Guardar foto
   * true  = ocultar botón Guardar foto
   */
  fotoGuardada = false;


  // =====================================================
  // FORMULARIO DE PERFIL
  // =====================================================

  readonly perfilForm = this.fb.nonNullable.group({

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


  // =====================================================
  // FORMULARIO PASSWORD
  // =====================================================

  readonly passwordForm = this.fb.nonNullable.group({

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
      Validators.required
    ]
  });


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.cargarPerfil();
  }


  // =====================================================
  // HOME
  // =====================================================

  irAHome(): void {
    this.router.navigate(['/home']);
  }


  // =====================================================
  // CARGAR PERFIL
  // =====================================================

  cargarPerfil(): void {

    this.usuarioService
      .obtenerMiPerfil()
      .subscribe({

        next: (response) => {

          this.usuario = response.usuario;

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

          /**
           * Si el usuario ya tiene una foto en el servidor,
           * significa que ya está guardada.
           */
          this.fotoGuardada =
            !!this.usuario.usuario_perfil;


          /**
           * Forzar actualización visual.
           */
          this.cdr.detectChanges();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo cargar el perfil.';

          this.cdr.detectChanges();
        }
      });
  }


  // =====================================================
  // GUARDAR PERFIL
  // =====================================================

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

          this.cdr.detectChanges();
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


          /**
           * Volvemos a consultar el perfil para
           * garantizar que la información mostrada
           * sea la que realmente está en el backend.
           */
          this.cargarPerfil();


          this.cdr.detectChanges();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo actualizar el perfil.';

          this.cdr.detectChanges();
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

        /**
         * Al seleccionar una nueva imagen,
         * todavía NO está guardada.
         *
         * Por eso vuelve a aparecer
         * el botón "Guardar foto".
         */
        this.fotoGuardada = false;

        this.cdr.detectChanges();
      }
    };


    reader.onerror = () => {

      this.error =
        'No se pudo leer la imagen.';

      this.cdr.detectChanges();
    };


    reader.readAsDataURL(file);
  }


  // =====================================================
  // GUARDAR FOTO
  // =====================================================

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

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {

          this.usuario =
            response.usuario;


          /**
           * Utilizamos la foto devuelta por el backend.
           */
          this.fotoPreview =
            response.usuario.usuario_perfil ?? null;


          /**
           * MARCAR COMO GUARDADA
           *
           * Esto hace desaparecer el botón.
           */
          this.fotoGuardada = true;


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


          /**
           * Volvemos a consultar el perfil para sincronizar
           * completamente la información con el backend.
           */
          this.cargarPerfil();


          /**
           * Actualización inmediata de la interfaz.
           */
          this.cdr.detectChanges();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo actualizar la foto.';

          this.cdr.detectChanges();
        }
      });
  }


  // =====================================================
  // ELIMINAR FOTO
  // =====================================================

  eliminarFoto(): void {

    this.mensaje = '';
    this.error = '';

    this.guardandoFoto = true;


    this.usuarioService
      .actualizarFotoPerfil(null)
      .pipe(
        finalize(() => {

          this.guardandoFoto = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {

          this.usuario =
            response.usuario;


          /**
           * Quitar imagen de la vista.
           */
          this.fotoPreview = null;


          /**
           * Ya no existe una foto guardada.
           */
          this.fotoGuardada = false;


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


          this.cdr.detectChanges();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo eliminar la foto.';

          this.cdr.detectChanges();
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

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {

          this.mensaje =
            response.message;

          this.passwordForm.reset();

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo cambiar la contraseña.';

          this.cdr.detectChanges();
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

          this.cdr.detectChanges();
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