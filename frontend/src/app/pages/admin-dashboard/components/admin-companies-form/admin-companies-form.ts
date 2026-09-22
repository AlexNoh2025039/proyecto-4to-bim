import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empresa, EmpresaResponse, EmpresasResponse } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { AuthService } from '../../../../core/services/auth.service';

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
  private readonly authService = inject(AuthService);

  empresas: Empresa[] = [];
  empresaSeleccionada: Empresa | null = null;

  cargando = false;
  guardando = false;
  eliminando = false;

  mostrarFormulario = false;
  modoEdicion = false;

  mensaje = '';
  error = '';
  busqueda = '';

  readonly empresaForm = this.fb.nonNullable.group({
    empresa_nombre: ['', [Validators.required, Validators.maxLength(100)]],
    empresa_correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    empresa_nit: ['', [Validators.required, Validators.maxLength(20)]],
    empresa_telefono: ['', Validators.maxLength(20)],
    empresa_direccion: ['', Validators.maxLength(200)],
    empresa_descripcion: [''],
    usuario_admin: [1, Validators.required]
  });

  ngOnInit(): void {
    this.cargarEmpresas();
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

    const miId = this.authService.currentUsuario()?.usuario_id ?? 1;

    this.empresaForm.reset({
      empresa_nombre: '',
      empresa_correo: '',
      empresa_nit: '',
      empresa_telefono: '',
      empresa_direccion: '',
      empresa_descripcion: '',
      usuario_admin: miId
    });
  }

  editarEmpresa(empresa: Empresa): void {
    this.empresaSeleccionada = empresa;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';

    this.empresaForm.reset({
      empresa_nombre: empresa.empresa_nombre,
      empresa_correo: empresa.empresa_correo,
      empresa_nit: empresa.empresa_nit ?? '',
      empresa_telefono: empresa.empresa_telefono ?? '',
      empresa_direccion: empresa.empresa_direccion ?? '',
      empresa_descripcion: empresa.empresa_descripcion ?? '',
      usuario_admin: empresa.usuario_admin ?? 1
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
      usuario_admin: 1
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
        next: (response: EmpresaResponse) => {
          this.mensaje = 'Empresa actualizada correctamente.';
          const empresaActualizada = response.empresa || response;

          const index = this.empresas.findIndex(
            (item) => item.empresa_id === this.empresaSeleccionada?.empresa_id
          );

          if (index !== -1) {
            this.empresas[index] = empresaActualizada;
          }

          this.empresaSeleccionada = empresaActualizada;
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
        next: (response: EmpresaResponse) => {
          this.mensaje = 'Empresa creada correctamente.';
          const nuevaEmpresa = response.empresa || response;

          this.empresas.unshift(nuevaEmpresa);
          this.cerrarFormulario();
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
        this.empresas = this.empresas.filter((item) => item.empresa_id !== empresa.empresa_id);

        if (this.empresaSeleccionada?.empresa_id === empresa.empresa_id) {
          this.cerrarFormulario();
        }

        this.mensaje = 'Empresa eliminada correctamente.';
        this.eliminando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar la empresa.';
        this.eliminando = false;
      }
    });
  }
}