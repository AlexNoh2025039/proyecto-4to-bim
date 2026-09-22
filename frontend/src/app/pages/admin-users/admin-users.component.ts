import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Usuario,
  RolUsuario,
  ActualizarUsuarioAdminRequest,
  CambiarPasswordAdminRequest
} from '../../core/models/auth.model';

import {
  UsuarioService
} from '../../core/services/usuario.service';

import {
  AuthService
} from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {

  private readonly fb =
    inject(FormBuilder);

  private readonly usuarioService =
    inject(UsuarioService);

  private readonly authService =
    inject(AuthService);

  usuarios: Usuario[] = [];

  usuarioSeleccionado:
    Usuario | null = null;

  cargando = false;
  guardando = false;
  cambiandoEstado = false;
  cambiandoPassword = false;
  eliminando = false;

  mostrarFormulario = false;
  mostrarPassword = false;

  mensaje = '';
  error = '';

  busqueda = '';

  filtroRol:
    RolUsuario | '' = '';

  filtroEstado:
    '' | 'true' | 'false' = '';

  readonly roles: RolUsuario[] = [
    'Administrador',
    'Empresa',
    'Candidato'
  ];

  readonly usuarioForm =
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
        Validators.maxLength(20)
      ],

      usuario_dpi: [
        '',
        Validators.maxLength(20)
      ],

      usuario_profesion: [
        '',
        Validators.maxLength(100)
      ],

      usuario_rol: [
        'Candidato' as RolUsuario,
        Validators.required
      ],

      estado: [
        true,
        Validators.required
      ]
    });

  readonly passwordForm =
    this.fb.nonNullable.group({

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

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {

    this.cargando = true;
    this.error = '';

    this.usuarioService
      .obtenerUsuarios()
      .subscribe({

        next: (response) => {

          this.usuarios =
            response.usuarios;

          this.cargando = false;
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudieron cargar los usuarios.';

          this.cargando = false;
        }
      });
  }
  get usuariosFiltrados(): Usuario[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.usuarios.filter(
      (usuario) => {

        const coincideBusqueda =
          !texto ||
          `${usuario.usuario_nombre} ${usuario.usuario_apellido}`
            .toLowerCase()
            .includes(texto) ||
          usuario.usuario_correo
            .toLowerCase()
            .includes(texto) ||
          (
            usuario.usuario_dpi ?? ''
          )
            .toLowerCase()
            .includes(texto);

        const coincideRol =
          !this.filtroRol ||
          usuario.usuario_rol ===
          this.filtroRol;

        const coincideEstado =
          !this.filtroEstado ||
          String(usuario.estado) ===
          this.filtroEstado;

        return (
          coincideBusqueda &&
          coincideRol &&
          coincideEstado
        );
      }
    );
  }

  limpiarFiltros(): void {

    this.busqueda = '';
    this.filtroRol = '';
    this.filtroEstado = '';
  }

  cerrarFormulario(): void {

    this.mostrarFormulario = false;
    this.usuarioSeleccionado = null;

    this.usuarioForm.reset({
      usuario_nombre: '',
      usuario_apellido: '',
      usuario_correo: '',
      usuario_telefono: '',
      usuario_dpi: '',
      usuario_profesion: '',
      usuario_rol: 'Candidato',
      estado: true
    });

    this.usuarioForm.controls.usuario_rol.enable();
    this.usuarioForm.controls.estado.enable();
  }

  editarUsuario(
    usuario: Usuario
  ): void {

    this.usuarioSeleccionado =
      usuario;

    this.mostrarFormulario =
      true;

    this.mostrarPassword =
      false;

    this.mensaje = '';
    this.error = '';

    this.usuarioForm.reset({
      usuario_nombre:
        usuario.usuario_nombre,

      usuario_apellido:
        usuario.usuario_apellido,

      usuario_correo:
        usuario.usuario_correo,

      usuario_telefono:
        usuario.usuario_telefono ?? '',

      usuario_dpi:
        usuario.usuario_dpi ?? '',

      usuario_profesion:
        usuario.usuario_profesion ?? '',

      usuario_rol:
        usuario.usuario_rol,

      estado:
        usuario.estado ?? true
    });

    const miId =
      this.authService
        .currentUsuario()
        ?.usuario_id;

    if (
      usuario.usuario_id === miId
    ) {
      this.usuarioForm
        .controls.usuario_rol
        .disable();

      this.usuarioForm
        .controls.estado
        .disable();
    } else {
      this.usuarioForm
        .controls.usuario_rol
        .enable();

      this.usuarioForm
        .controls.estado
        .enable();
    }

    this.passwordForm.reset();
  }

  guardarUsuario(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.usuarioSeleccionado
    ) {
      return;
    }

    if (
      this.usuarioForm.invalid
    ) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const value =
      this.usuarioForm.getRawValue();

    const data:
      ActualizarUsuarioAdminRequest = {

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
        value.usuario_dpi.trim() || null,

      usuario_profesion:
        value.usuario_profesion.trim() || null,

      usuario_rol:
        value.usuario_rol,

      estado:
        value.estado
    };

    this.guardando = true;

    this.usuarioService
      .actualizarUsuario(
        this.usuarioSeleccionado.usuario_id,
        data
      )
      .subscribe({

        next: (response) => {

          this.mensaje =
            'Usuario actualizado correctamente.';

          const index =
            this.usuarios.findIndex(
              usuario =>
                usuario.usuario_id ===
                response.usuario.usuario_id
            );

          if (index !== -1) {
            this.usuarios[index] =
              response.usuario;
          }

          const miId =
            this.authService
              .currentUsuario()
              ?.usuario_id;

          if (
            response.usuario.usuario_id ===
            miId
          ) {
            this.authService
              .updateCurrentUsuario(
                response.usuario
              );
          }

          this.usuarioSeleccionado =
            response.usuario;

          this.guardando = false;
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo actualizar el usuario.';

          this.guardando = false;
        }
      });
  }

  cambiarEstado(
    usuario: Usuario
  ): void {

    const miId =
      this.authService
        .currentUsuario()
        ?.usuario_id;

    if (
      usuario.usuario_id === miId
    ) {

      this.error =
        'No puedes desactivar tu propia cuenta desde esta pantalla.';

      return;
    }

    const nuevoEstado =
      usuario.estado !== true;

    const accion =
      nuevoEstado
        ? 'activar'
        : 'desactivar';

    const confirmar =
      window.confirm(
        `¿Deseas ${accion} a ${usuario.usuario_nombre} ${usuario.usuario_apellido}?`
      );

    if (!confirmar) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    this.cambiandoEstado = true;

    this.usuarioService
      .cambiarEstado(
        usuario.usuario_id,
        nuevoEstado
      )
      .subscribe({

        next: (response) => {

          const index =
            this.usuarios.findIndex(
              item =>
                item.usuario_id ===
                usuario.usuario_id
            );

          if (index !== -1) {
            this.usuarios[index] =
              response.usuario;
          }

          if (
            this.usuarioSeleccionado
              ?.usuario_id ===
            usuario.usuario_id
          ) {
            this.usuarioSeleccionado =
              response.usuario;

            this.usuarioForm.patchValue({
              estado:
                response.usuario.estado ?? false
            });
          }

          this.mensaje =
            response.message;

          this.cambiandoEstado =
            false;
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo cambiar el estado.';

          this.cambiandoEstado =
            false;
        }
      });
  }

  mostrarCambiarPassword(
    usuario: Usuario
  ): void {

    this.usuarioSeleccionado =
      usuario;

    this.mostrarFormulario =
      true;

    this.mostrarPassword =
      true;

    this.passwordForm.reset();

    this.mensaje = '';
    this.error = '';
  }

  cerrarCambiarPassword(): void {

    this.mostrarPassword =
      false;

    this.passwordForm.reset();
  }

  guardarPassword(): void {

    this.mensaje = '';
    this.error = '';

    if (
      !this.usuarioSeleccionado
    ) {
      return;
    }

    if (
      this.passwordForm.invalid
    ) {

      this.passwordForm
        .markAllAsTouched();

      return;
    }

    const value =
      this.passwordForm
        .getRawValue();

    if (
      value.usuario_password_nueva !==
      value.confirmar_password
    ) {

      this.error =
        'Las contraseñas no coinciden.';

      return;
    }

    const data:
      CambiarPasswordAdminRequest = {
      usuario_password_nueva:
        value.usuario_password_nueva
    };

    this.cambiandoPassword = true;

    this.usuarioService
      .cambiarPasswordAdmin(
        this.usuarioSeleccionado.usuario_id,
        data
      )
      .subscribe({

        next: (response) => {

          this.mensaje =
            response.message;

          this.passwordForm.reset();

          this.mostrarPassword =
            false;

          this.cambiandoPassword =
            false;
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo cambiar la contraseña.';

          this.cambiandoPassword =
            false;
        }
      });
  }

  eliminarUsuario(
    usuario: Usuario
  ): void {

    const miId =
      this.authService
        .currentUsuario()
        ?.usuario_id;

    if (
      usuario.usuario_id === miId
    ) {

      this.error =
        'No puedes eliminar tu propia cuenta desde esta pantalla.';

      return;
    }

    const nombre =
      `${usuario.usuario_nombre} ${usuario.usuario_apellido}`;

    const confirmar =
      window.confirm(
        `¿Está seguro de eliminar a ${nombre}? Esto eliminara todo lo relacionado a su cuenta.`
      );

    if (!confirmar) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    this.eliminando = true;

    this.usuarioService
      .eliminarUsuario(
        usuario.usuario_id
      )
      .subscribe({

        next: (response) => {

          this.usuarios =
            this.usuarios.filter(
              item =>
                item.usuario_id !==
                usuario.usuario_id
            );

          if (
            this.usuarioSeleccionado
              ?.usuario_id ===
            usuario.usuario_id
          ) {
            this.cerrarFormulario();
          }

          this.mensaje =
            response.message;

          this.eliminando =
            false;
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo eliminar el usuario.';

          this.eliminando =
            false;
        }
      });
  }

  obtenerNombreCompleto(
    usuario: Usuario
  ): string {

    return `${usuario.usuario_nombre} ${usuario.usuario_apellido}`;
  }

  esMiUsuario(
    usuario: Usuario
  ): boolean {

    return (
      usuario.usuario_id ===
      this.authService
        .currentUsuario()
        ?.usuario_id
    );
  }
}