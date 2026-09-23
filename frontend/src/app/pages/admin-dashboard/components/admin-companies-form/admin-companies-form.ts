import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empresa, EmpresasResponse } from '../../../../core/models/empresa.model';
import { Usuario, UsuariosResponse } from '../../../../core/models/auth.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-companies-form.html',
  styleUrl: './admin-companies-form.css'
})
export class AdminCompaniesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  empresas: Empresa[] = [];
  usuariosEmpresa: Usuario[] = [];
  empresaSeleccionada: Empresa | null = null;

  cargando = false;
  cargandoUsuarios = false;
  guardando = false;
  eliminando = false;

  mostrarFormulario = false;
  modoEdicion = false;

  mensaje = '';
  error = '';
  busqueda = '';

  regresarAHome(): void {
    this.router.navigate(['/home']);
  }

  readonly empresaForm = this.fb.nonNullable.group({
    empresa_nombre: ['', [Validators.required, Validators.maxLength(100)]],
    empresa_correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    empresa_nit: ['', [Validators.required, Validators.maxLength(20)]],
    empresa_telefono: ['', Validators.maxLength(20)],
    empresa_direccion: ['', Validators.maxLength(200)],
    empresa_descripcion: [''],
    usuario_admin: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.cargarEmpresas();
    this.cargarUsuariosEmpresa();
  }

  cargarEmpresas(): void {
    this.cargando = true;
    this.error = '';

    this.empresaService.getEmpresas().subscribe({
      next: (response: EmpresasResponse) => {
        this.empresas = response.empresas || response;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar las empresas.';
        this.cargando = false;
      }
    });
  }

  cargarUsuariosEmpresa(): void {
    this.cargandoUsuarios = true;

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (response: UsuariosResponse) => {
        this.usuariosEmpresa = (response.usuarios || []).filter(
          (u) => u.usuario_rol === 'Empresa' && u.usuario_id !== 1
        );
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los usuarios de empresa.';
        this.cargandoUsuarios = false;
      }
    });
  }

  get empresasFiltradas(): Empresa[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.empresas.filter((empresa) => {
      return (
        !texto ||
        empresa.empresa_nombre.toLowerCase().includes(texto) ||
        empresa.empresa_correo.toLowerCase().includes(texto) ||
        (empresa.empresa_nit ?? '').toLowerCase().includes(texto) ||
        (empresa.empresa_telefono ?? '').toLowerCase().includes(texto)
      );
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
  }

  abrirFormularioCrear(): void {
    this.empresaSeleccionada = null;
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';

    this.empresaForm.reset({
      empresa_nombre: '',
      empresa_correo: '',
      empresa_nit: '',
      empresa_telefono: '',
      empresa_direccion: '',
      empresa_descripcion: '',
      usuario_admin: 0
    });
  }

  aplicarFiltros(): void {
  }

  editarEmpresa(empresa: Empresa): void {
    this.empresaSeleccionada = empresa;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';

    const yaExiste = this.usuariosEmpresa.some(
      (u) => u.usuario_id === empresa.usuario_admin
    );
    if (!yaExiste && empresa.usuario_admin) {
      this.usuariosEmpresa = [
        ...this.usuariosEmpresa,
        {
          usuario_id: empresa.usuario_admin,
          usuario_nombre: `Usuario #${empresa.usuario_admin}`,
          usuario_apellido: '',
          usuario_correo: '',
          usuario_telefono: null,
          usuario_dpi: '',
          usuario_profesion: null,
          usuario_rol: 'Empresa'
        } as Usuario
      ];
    }

    this.empresaForm.reset({
      empresa_nombre: empresa.empresa_nombre,
      empresa_correo: empresa.empresa_correo,
      empresa_nit: empresa.empresa_nit ?? '',
      empresa_telefono: empresa.empresa_telefono ?? '',
      empresa_direccion: empresa.empresa_direccion ?? '',
      empresa_descripcion: empresa.empresa_descripcion ?? '',
      usuario_admin: empresa.usuario_admin ?? 0
    });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.empresaSeleccionada = null;

    this.empresaForm.reset({
      empresa_nombre: '',
      empresa_correo: '',
      empresa_nit: '',
      empresa_telefono: '',
      empresa_direccion: '',
      empresa_descripcion: '',
      usuario_admin: 0
    });
  }

  guardarEmpresa(): void {
    this.mensaje = '';
    this.error = '';

    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    const value = this.empresaForm.getRawValue();
    this.guardando = true;

    if (this.modoEdicion && this.empresaSeleccionada?.empresa_id) {
      const dataActualizar: Empresa = {
        empresa_id: this.empresaSeleccionada.empresa_id,
        empresa_nombre: value.empresa_nombre.trim(),
        empresa_correo: value.empresa_correo.trim().toLowerCase(),
        empresa_nit: value.empresa_nit.trim() || undefined,
        empresa_telefono: value.empresa_telefono.trim() || undefined,
        empresa_direccion: value.empresa_direccion.trim() || undefined,
        empresa_descripcion: value.empresa_descripcion.trim() || undefined,
        usuario_admin: value.usuario_admin
      };

      this.empresaService.putEmpresa(this.empresaSeleccionada.empresa_id, dataActualizar).subscribe({
        next: () => {
          this.mensaje = 'Empresa actualizada correctamente.';
          this.cerrarFormulario();
          this.cargarEmpresas();
          this.guardando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo actualizar la empresa.';
          this.guardando = false;
        }
      });
    } else {
      const dataCrear: Empresa = {
        empresa_nombre: value.empresa_nombre.trim(),
        empresa_correo: value.empresa_correo.trim().toLowerCase(),
        empresa_nit: value.empresa_nit.trim() || undefined,
        empresa_telefono: value.empresa_telefono.trim() || undefined,
        empresa_direccion: value.empresa_direccion.trim() || undefined,
        empresa_descripcion: value.empresa_descripcion.trim() || undefined,
        usuario_admin: value.usuario_admin
      };

      this.empresaService.postEmpresa(dataCrear).subscribe({
        next: () => {
          this.mensaje = 'Empresa creada correctamente.';
          this.cerrarFormulario();
          this.cargarEmpresas();
          this.guardando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo crear la empresa.';
          this.guardando = false;
        }
      });
    }
  }

  eliminarEmpresa(empresa: Empresa): void {
    if (!empresa.empresa_id) return;

    const confirmar = window.confirm(
      `¿Está seguro de eliminar la empresa ${empresa.empresa_nombre}? Esto eliminará sus vacantes asociadas.`
    );
    if (!confirmar) return;

    this.mensaje = '';
    this.error = '';
    this.eliminando = true;

    this.empresaService.deleteEmpresa(empresa.empresa_id).subscribe({
      next: () => {
        this.mensaje = 'Empresa eliminada correctamente.';
        this.eliminando = false;
        this.cargarEmpresas();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar la empresa.';
        this.eliminando = false;
      }
    });
  }
}