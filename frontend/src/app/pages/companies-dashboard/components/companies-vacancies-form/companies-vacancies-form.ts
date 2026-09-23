import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vacante, VacanteResponse, VacantesResponse } from '../../../../core/models/vacante.model';
import { Empresa, EmpresasResponse } from '../../../../core/models/empresa.model';
import { VacanteService } from '../../../../core/services/vacante.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-companies-vacancies-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './companies-vacancies-form.html',
  styleUrl: './companies-vacancies-form.css'
})
export class CompaniesVacanciesFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vacanteService = inject(VacanteService);
  private readonly empresaService = inject(EmpresaService);
  private readonly authService = inject(AuthService);

  vacantes: Vacante[] = [];
  empresas: Empresa[] = [];
  vacanteSeleccionada: Vacante | null = null;

  cargando = false;
  guardando = false;
  eliminando = false;

  mostrarFormulario = false;
  modoEdicion = false;

  mensaje = '';
  error = '';
  busqueda = '';
  filtroJornada = '';
  filtroEstado = '';

  esAdmin = false;
  empresaIdUsuario: number | null = null;

  readonly jornadas = ['Tiempo Completo', 'Medio Tiempo', 'Freelance', 'Temporal'];

  readonly vacanteForm = this.fb.nonNullable.group({
    vacante_nombre: ['', [Validators.required, Validators.maxLength(150)]],
    vacante_descripcion: [''],
    habilidades_requeridas: [''],
    categoria: [''],
    salario: [null as number | null, [Validators.min(0)]],
    ubicacion: [''],
    tipo_jornada: ['Tiempo Completo' as 'Tiempo Completo' | 'Medio Tiempo' | 'Freelance' | 'Temporal', Validators.required],
    estado: [true, Validators.required],
    empresa_id: [1, Validators.required]
  });

  ngOnInit(): void {
    this.verificarRol();
    this.cargarEmpresas();
  }

  verificarRol(): void {
    const usuario = this.authService.currentUsuario();
    this.esAdmin = usuario?.usuario_rol === 'Administrador';
  }

  cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (response: EmpresasResponse) => {
        this.empresas = response.empresas || response;
        
        const usuario = this.authService.currentUsuario();
        if (!this.esAdmin && usuario) {
          const empresaPropia = this.empresas.find(e => e.usuario_admin === usuario.usuario_id);
          if (empresaPropia) {
            this.empresaIdUsuario = empresaPropia.empresa_id ?? null;
          }
        }

        this.cargarVacantes();
      },
      error: (err) => {
        console.error('Error al cargar empresas', err);
        this.cargarVacantes();
      }
    });
  }

  cargarVacantes(): void {
    this.cargando = true;
    this.error = '';

    this.vacanteService.getVacantes().subscribe({
      next: (response: VacantesResponse) => {
        let lista = response.vacantes || response;

        if (!this.esAdmin && this.empresaIdUsuario) {
          lista = lista.filter(v => v.empresa_id === this.empresaIdUsuario);
        }

        this.vacantes = lista;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar las vacantes.';
        this.cargando = false;
      }
    });
  }

  get vacantesFiltradas(): Vacante[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.vacantes.filter((vacante) => {
      const coincideTexto =
        !texto ||
        vacante.vacante_nombre.toLowerCase().includes(texto) ||
        (vacante.categoria ?? '').toLowerCase().includes(texto) ||
        (vacante.ubicacion ?? '').toLowerCase().includes(texto);

      const coincideJornada = !this.filtroJornada || vacante.tipo_jornada === this.filtroJornada;
      const coincideEstado = !this.filtroEstado || String(vacante.estado) === this.filtroEstado;

      return coincideTexto && coincideJornada && coincideEstado;
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroJornada = '';
    this.filtroEstado = '';
  }

  abrirFormularioCrear(): void {
    this.vacanteSeleccionada = null;
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';

    const idEmpresaDefault = this.empresaIdUsuario ?? (this.empresas[0]?.empresa_id || 1);

    this.vacanteForm.reset({
      vacante_nombre: '',
      vacante_descripcion: '',
      habilidades_requeridas: '',
      categoria: '',
      salario: null,
      ubicacion: '',
      tipo_jornada: 'Tiempo Completo',
      estado: true,
      empresa_id: idEmpresaDefault
    });
  }

  editarVacante(vacante: Vacante): void {
    this.vacanteSeleccionada = vacante;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';

    this.vacanteForm.reset({
      vacante_nombre: vacante.vacante_nombre,
      vacante_descripcion: vacante.vacante_descripcion ?? '',
      habilidades_requeridas: vacante.habilidades_requeridas ?? '',
      categoria: vacante.categoria ?? '',
      salario: vacante.salario ?? null,
      ubicacion: vacante.ubicacion ?? '',
      tipo_jornada: vacante.tipo_jornada ?? 'Tiempo Completo',
      estado: vacante.estado ?? true,
      empresa_id: vacante.empresa_id
    });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.vacanteSeleccionada = null;

    this.vacanteForm.reset({
      vacante_nombre: '',
      vacante_descripcion: '',
      habilidades_requeridas: '',
      categoria: '',
      salario: null,
      ubicacion: '',
      tipo_jornada: 'Tiempo Completo',
      estado: true,
      empresa_id: 1
    });
  }

  guardarVacante(): void {
    this.mensaje = '';
    this.error = '';

    if (this.vacanteForm.invalid) {
      this.vacanteForm.markAllAsTouched();
      return;
    }

    const value = this.vacanteForm.getRawValue();
    this.guardando = true;

    if (this.modoEdicion && this.vacanteSeleccionada?.vacante_id) {
      const dataActualizar: Vacante = {
        vacante_id: this.vacanteSeleccionada.vacante_id,
        vacante_nombre: value.vacante_nombre.trim(),
        vacante_descripcion: value.vacante_descripcion.trim() || undefined,
        habilidades_requeridas: value.habilidades_requeridas.trim() || undefined,
        categoria: value.categoria.trim() || undefined,
        salario: value.salario ?? undefined,
        ubicacion: value.ubicacion.trim() || undefined,
        tipo_jornada: value.tipo_jornada,
        estado: value.estado,
        empresa_id: value.empresa_id
      };

      this.vacanteService.putVacante(this.vacanteSeleccionada.vacante_id, dataActualizar).subscribe({
        next: (response: VacanteResponse) => {
          this.mensaje = 'Vacante actualizada correctamente.';
          const vacanteActualizada = response.vacante || response;

          const index = this.vacantes.findIndex(
            (item) => item.vacante_id === this.vacanteSeleccionada?.vacante_id
          );

          if (index !== -1) {
            this.vacantes[index] = vacanteActualizada;
          }

          this.vacanteSeleccionada = vacanteActualizada;
          this.guardando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo actualizar la vacante.';
          this.guardando = false;
        }
      });
    } else {
      const dataCrear: Vacante = {
        vacante_nombre: value.vacante_nombre.trim(),
        vacante_descripcion: value.vacante_descripcion.trim() || undefined,
        habilidades_requeridas: value.habilidades_requeridas.trim() || undefined,
        categoria: value.categoria.trim() || undefined,
        salario: value.salario ?? undefined,
        ubicacion: value.ubicacion.trim() || undefined,
        tipo_jornada: value.tipo_jornada,
        estado: value.estado,
        empresa_id: value.empresa_id
      };

      this.vacanteService.postVacante(dataCrear).subscribe({
        next: (response: VacanteResponse) => {
          this.mensaje = 'Vacante publicada correctamente.';
          const nuevaVacante = response.vacante || response;

          this.vacantes.unshift(nuevaVacante);
          this.cerrarFormulario();
          this.guardando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo publicar la vacante.';
          this.guardando = false;
        }
      });
    }
  }

  eliminarVacante(vacante: Vacante): void {
    if (!vacante.vacante_id) return;

    const confirmar = window.confirm(
      `¿Está seguro de eliminar la vacante "${vacante.vacante_nombre}"?`
    );

    if (!confirmar) return;

    this.mensaje = '';
    this.error = '';
    this.eliminando = true;

    this.vacanteService.deleteVacante(vacante.vacante_id).subscribe({
      next: () => {
        this.vacantes = this.vacantes.filter((item) => item.vacante_id !== vacante.vacante_id);

        if (this.vacanteSeleccionada?.vacante_id === vacante.vacante_id) {
          this.cerrarFormulario();
        }

        this.mensaje = 'Vacante eliminada correctamente.';
        this.eliminando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar la vacante.';
        this.eliminando = false;
      }
    });
  }

  obtenerNombreEmpresa(empresa_id: number): string {
    const emp = this.empresas.find(e => e.empresa_id === empresa_id);
    return emp ? emp.empresa_nombre : `Empresa #${empresa_id}`;
  }
}