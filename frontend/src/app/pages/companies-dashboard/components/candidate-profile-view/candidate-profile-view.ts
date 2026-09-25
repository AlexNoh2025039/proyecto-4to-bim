import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { CurriculumService } from '../../../../core/services/curriculum.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { VacanteService } from '../../../../core/services/vacante.service';
import { Postulacion } from '../../../../core/models/postulacion.model';
import { Curriculum } from '../../../../core/models/curriculum.model';
import { Usuario } from '../../../../core/models/auth.model';
import { Vacante } from '../../../../core/models/vacante.model';

@Component({
  selector: 'app-candidate-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-profile-view.html',
  styleUrl: './candidate-profile-view.css',
})
export class CandidateProfileView implements OnInit {
  private readonly postulacionService = inject(PostulacionService);
  private readonly curriculumService = inject(CurriculumService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly vacanteService = inject(VacanteService);

  postulaciones: Postulacion[] = [];
  postulacionesFiltradas: Postulacion[] = [];
  usuariosMap = new Map<number, Usuario>();
  vacantesMap = new Map<number, Vacante>();
  curriculumsMap = new Map<number, Curriculum>();

  postulacionSeleccionada: Postulacion | null = null;
  candidatoSeleccionado: Usuario | null = null;
  curriculumSeleccionado: Curriculum | null = null;
  vacanteSeleccionada: Vacante | null = null;

  cargando = true;
  cargandoDetalle = false;
  actualizandoEstado = false;
  mensaje = '';
  error = '';

  filtroBusqueda = '';
  filtroEstado = '';
  estados: string[] = ['Pendiente', 'En Revision', 'Aceptado', 'Rechazado'];

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    this.error = '';

    // Cargar postulaciones
    this.postulacionService.getPostulaciones().subscribe({
      next: (res) => {
        this.postulaciones = res.postulaciones || [];
        this.postulacionesFiltradas = [...this.postulaciones];
        this.cargarUsuariosYVacantes();
      },
      error: (err) => {
        console.error('Error al cargar postulaciones', err);
        this.error = 'No se pudieron cargar las postulaciones.';
        this.cargando = false;
      }
    });
  }

  private cargarUsuariosYVacantes(): void {
    // Cargar auxiliares si existen los métodos en los servicios
    this.usuarioService.obtenerUsuarios?.().subscribe({
      next: (res: any) => {
        const lista = res.usuarios || res;
        if (Array.isArray(lista)) {
          lista.forEach((u: Usuario) => this.usuariosMap.set(u.usuario_id!, u));
        }
      }
    });

    this.vacanteService.getVacantes?.().subscribe({
      next: (res: any) => {
        const lista = res.vacantes || res;
        if (Array.isArray(lista)) {
          lista.forEach((v: Vacante) => this.vacantesMap.set(v.vacante_id!, v));
        }
      }
    });

    this.curriculumService.obtenerTodos().subscribe({
      next: (res) => {
        (res.curriculums || []).forEach(c => this.curriculumsMap.set(c.usuario_id, c));
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.postulacionesFiltradas = this.postulaciones.filter(p => {
      const candidato = this.usuariosMap.get(p.usuario_id);
      const vacante = this.vacantesMap.get(p.vacante_id);

      const nombreCandidato = candidato ? `${candidato.usuario_nombre} ${candidato.usuario_apellido}`.toLowerCase() : '';
      const tituloVacante = vacante ? vacante.vacante_nombre.toLowerCase() : '';
      const busqueda = this.filtroBusqueda.toLowerCase();

      const coincideBusqueda = !busqueda || nombreCandidato.includes(busqueda) || tituloVacante.includes(busqueda);
      const coincideEstado = !this.filtroEstado || p.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = '';
    this.postulacionesFiltradas = [...this.postulaciones];
  }

  verDetalleCandidato(postulacion: Postulacion): void {
    this.postulacionSeleccionada = postulacion;
    this.candidatoSeleccionado = this.usuariosMap.get(postulacion.usuario_id) || null;
    this.vacanteSeleccionada = this.vacantesMap.get(postulacion.vacante_id) || null;
    this.curriculumSeleccionado = this.curriculumsMap.get(postulacion.usuario_id) || null;
  }

  cerrarDetalle(): void {
    this.postulacionSeleccionada = null;
    this.candidatoSeleccionado = null;
    this.curriculumSeleccionado = null;
    this.vacanteSeleccionada = null;
  }

  cambiarEstadoPostulacion(nuevoEstado: string): void {
    if (!this.postulacionSeleccionada || !this.postulacionSeleccionada.postulacion_id) return;

    this.actualizandoEstado = true;
    this.mensaje = '';
    this.error = '';

    const payload = {
      usuario_id: this.postulacionSeleccionada.usuario_id,
      vacante_id: this.postulacionSeleccionada.vacante_id,
      porcentaje_compatibilidad: this.postulacionSeleccionada.porcentaje_compatibilidad,
      estado: nuevoEstado
    };

    this.postulacionService.putPostulacion(this.postulacionSeleccionada.postulacion_id, payload).subscribe({
      next: () => {
        this.postulacionSeleccionada!.estado = nuevoEstado;
        this.actualizandoEstado = false;
        this.mensaje = `Estado actualizado a '${nuevoEstado}' correctamente.`;
        setTimeout(() => this.mensaje = '', 4000);
      },
      error: (err) => {
        console.error('Error al actualizar estado', err);
        this.error = 'No se pudo actualizar el estado de la postulación.';
        this.actualizandoEstado = false;
      }
    });
  }

  obtenerNombreCandidato(usuarioId: number): string {
    const user = this.usuariosMap.get(usuarioId);
    return user ? `${user.usuario_nombre} ${user.usuario_apellido}` : `Candidato #${usuarioId}`;
  }

  obtenerNombreVacante(vacanteId: number): string {
    const vacante = this.vacantesMap.get(vacanteId);
    return vacante ? vacante.vacante_nombre : `Vacante #${vacanteId}`;
  }
}