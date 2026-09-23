import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuario, UsuariosResponse } from '../../../../core/models/auth.model';
import { Postulacion, PostulacionesResponse } from '../../../../core/models/postulacion.model';
import { Historial, HistorialesResponse } from '../../../../core/models/historial.model';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { HistorialService } from '../../../../core/services/historial.service';

type Vista = 'candidatos' | 'postulaciones' | 'historial';

@Component({
  selector: 'app-user-record-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-record-form.html',
  styleUrl: './user-record-form.css'
})
export class UserRecordForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly postulacionService = inject(PostulacionService);
  private readonly historialService = inject(HistorialService);
  private readonly router = inject(Router);

  vista: Vista = 'candidatos';

  candidatos: Usuario[] = [];
  candidatoSeleccionado: Usuario | null = null;
  cargandoCandidatos = false;
  busqueda = '';

  postulaciones: Postulacion[] = [];
  postulacionSeleccionada: Postulacion | null = null;
  cargandoPostulaciones = false;

  historial: Historial[] = [];
  entradaSeleccionada: Historial | null = null;
  cargandoHistorial = false;

  guardando = false;
  eliminando = false;
  mostrarFormulario = false;
  modoEdicion = false;

  mensaje = '';
  error = '';

  readonly historialForm = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    this.cargarCandidatos();
  }

  regresarAHome(): void {
    this.router.navigate(['/home']);
  }

  limpiarMensajes(): void {
    this.mensaje = '';
    this.error = '';
  }

  cargarCandidatos(): void {
    this.cargandoCandidatos = true;
    this.error = '';

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (response: UsuariosResponse) => {
        this.candidatos = (response.usuarios || []).filter(u => u.usuario_rol === 'Candidato');
        this.cargandoCandidatos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los candidatos.';
        this.cargandoCandidatos = false;
      }
    });
  }

  get candidatosFiltrados(): Usuario[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.candidatos.filter(c =>
      !texto ||
      `${c.usuario_nombre} ${c.usuario_apellido}`.toLowerCase().includes(texto) ||
      c.usuario_correo.toLowerCase().includes(texto) ||
      (c.usuario_dpi ?? '').toLowerCase().includes(texto)
    );
  }

  verExpediente(candidato: Usuario): void {
    this.candidatoSeleccionado = candidato;
    this.vista = 'postulaciones';
    this.limpiarMensajes();
    this.cargarPostulaciones();
  }

  cargarPostulaciones(): void {
    if (!this.candidatoSeleccionado) return;

    this.cargandoPostulaciones = true;
    this.error = '';

    this.postulacionService.getPostulaciones().subscribe({
      next: (response: PostulacionesResponse) => {
        const todas = response.postulaciones || [];
        this.postulaciones = todas.filter(p => p.usuario_id === this.candidatoSeleccionado?.usuario_id);
        this.cargandoPostulaciones = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar las postulaciones.';
        this.cargandoPostulaciones = false;
      }
    });
  }

  volverACandidatos(): void {
    this.vista = 'candidatos';
    this.candidatoSeleccionado = null;
    this.postulaciones = [];
    this.limpiarMensajes();
  }

  verHistorialPostulacion(postulacion: Postulacion): void {
    this.postulacionSeleccionada = postulacion;
    this.vista = 'historial';
    this.limpiarMensajes();
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    if (!this.postulacionSeleccionada?.postulacion_id) return;

    this.cargandoHistorial = true;
    this.error = '';

    this.historialService.getHistorialesPorPostulacion(this.postulacionSeleccionada.postulacion_id).subscribe({
      next: (response: HistorialesResponse) => {
        this.historial = response.historial || [];
        this.cargandoHistorial = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar el historial.';
        this.cargandoHistorial = false;
      }
    });
  }

  volverAPostulaciones(): void {
    this.vista = 'postulaciones';
    this.postulacionSeleccionada = null;
    this.historial = [];
    this.cerrarFormulario();
    this.limpiarMensajes();
  }

  abrirFormularioCrear(): void {
    this.entradaSeleccionada = null;
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.limpiarMensajes();
    this.historialForm.reset({ descripcion: '' });
  }

  editarEntrada(entrada: Historial): void {
    this.entradaSeleccionada = entrada;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.limpiarMensajes();
    this.historialForm.reset({ descripcion: entrada.descripcion });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.entradaSeleccionada = null;
    this.historialForm.reset({ descripcion: '' });
  }

  guardarEntrada(): void {
    this.limpiarMensajes();

    if (!this.postulacionSeleccionada?.postulacion_id) return;

    if (this.historialForm.invalid) {
      this.historialForm.markAllAsTouched();
      return;
    }

    const descripcion = this.historialForm.getRawValue().descripcion.trim();
    const postulacion_id = this.postulacionSeleccionada.postulacion_id;

    this.guardando = true;

    if (this.modoEdicion && this.entradaSeleccionada?.historial_id) {
      this.historialService.putHistorial(this.entradaSeleccionada.historial_id, { descripcion, postulacion_id }).subscribe({
        next: () => {
          this.mensaje = 'Entrada de historial actualizada correctamente.';
          this.cerrarFormulario();
          this.cargarHistorial();
          this.guardando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo actualizar la entrada.';
          this.guardando = false;
        }
      });
    } else {
      this.historialService.postHistorial({ descripcion, postulacion_id }).subscribe({
        next: () => {
          this.mensaje = 'Entrada de historial agregada correctamente.';
          this.cerrarFormulario();
          this.cargarHistorial();
          this.guardando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo agregar la entrada.';
          this.guardando = false;
        }
      });
    }
  }

  eliminarEntrada(entrada: Historial): void {
    if (!entrada.historial_id) return;

    const confirmar = window.confirm('¿Está seguro de eliminar esta entrada del historial?');
    if (!confirmar) return;

    this.limpiarMensajes();
    this.eliminando = true;

    this.historialService.deleteHistorial(entrada.historial_id).subscribe({
      next: () => {
        this.mensaje = 'Entrada eliminada correctamente.';
        this.eliminando = false;
        this.cargarHistorial();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar la entrada.';
        this.eliminando = false;
      }
    });
  }

  obtenerNombreCandidato(usuario: Usuario): string {
    return `${usuario.usuario_nombre} ${usuario.usuario_apellido}`;
  }
}