import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  Curriculum,
  CrearCurriculumRequest
} from '../../core/models/curriculum.model';

import {
  CurriculumService
} from '../../core/services/curriculum.service';

@Component({
  selector: 'app-curriculum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.css'
})
export class CurriculumComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly curriculumService = inject(CurriculumService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  curriculums: Curriculum[] = [];

  curriculumSeleccionado: Curriculum | null = null;

  archivoSeleccionado: File | null = null;
  archivoPreview: string | null = null;
  nombreArchivo = '';

  editando = false;
  guardando = false;
  cargando = false;

  mensaje = '';
  error = '';

  readonly curriculumForm = this.fb.nonNullable.group({
    curriculum_nombre: [
      '',
      [Validators.required, Validators.maxLength(100)]
    ],

    categoria_interes: [
      '',
      [Validators.required, Validators.maxLength(100)]
    ],

    habilidades: [''],
    experiencia: [''],
    formacion: ['']
  });

  ngOnInit(): void {
    this.cargarCurriculums();
  }

  /**
   * Regresar a Home
   */
  irAHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Cargar curriculums desde el servidor.
   *
   * IMPORTANTE:
   * No usamos "if (this.cargando) return",
   * porque eso podía bloquear una recarga.
   */
  cargarCurriculums(): void {
    this.cargando = true;
    this.error = '';

    this.curriculumService
      .obtenerMisCurriculums()
      .pipe(
        finalize(() => {
          this.cargando = false;

          // Forzamos la actualización de la vista.
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.curriculums = [...response.curriculums];
        },

        error: (error) => {
          this.error =
            error?.error?.message ||
            'No se pudieron cargar tus curriculums.';
        }
      });
  }

  /**
   * Preparar formulario para crear un nuevo curriculum
   */
  nuevoCurriculum(): void {
    this.editando = false;
    this.curriculumSeleccionado = null;

    this.archivoSeleccionado = null;
    this.archivoPreview = null;
    this.nombreArchivo = '';

    this.curriculumForm.reset({
      curriculum_nombre: '',
      categoria_interes: '',
      habilidades: '',
      experiencia: '',
      formacion: ''
    });
  }

  /**
   * Editar curriculum existente
   */
  editarCurriculum(curriculum: Curriculum): void {
    this.editando = true;
    this.curriculumSeleccionado = curriculum;

    this.archivoSeleccionado = null;
    this.nombreArchivo = '';

    this.mensaje = '';
    this.error = '';

    this.curriculumForm.patchValue({
      curriculum_nombre: curriculum.curriculum_nombre,
      categoria_interes: curriculum.categoria_interes,
      habilidades: curriculum.habilidades ?? '',
      experiencia: curriculum.experiencia ?? '',
      formacion: curriculum.formacion ?? ''
    });

    if (curriculum.tiene_archivo) {

      this.curriculumService
        .obtenerCurriculum(curriculum.curriculum_id)
        .subscribe({
          next: (response) => {
            this.archivoPreview =
              response.curriculum.curriculum_archivo ?? null;

            this.cdr.detectChanges();
          },

          error: () => {
            this.archivoPreview = null;
            this.cdr.detectChanges();
          }
        });

    } else {
      this.archivoPreview = null;
    }
  }

  /**
   * Seleccionar PDF
   */
  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    if (file.type !== 'application/pdf') {
      this.error = 'Solo puedes seleccionar archivos PDF.';
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.error = 'El PDF no puede superar los 10 MB.';
      input.value = '';
      return;
    }

    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;
  }

  /**
   * Guardar curriculum
   */
  guardarCurriculum(): void {
    this.mensaje = '';
    this.error = '';

    if (this.curriculumForm.invalid) {
      this.curriculumForm.markAllAsTouched();
      return;
    }

    const value = this.curriculumForm.getRawValue();

    if (this.archivoSeleccionado) {
      this.convertirArchivoBase64(
        this.archivoSeleccionado,
        value
      );

      return;
    }

    const data: CrearCurriculumRequest = {
      curriculum_nombre: value.curriculum_nombre.trim(),
      categoria_interes: value.categoria_interes.trim(),
      habilidades: value.habilidades.trim() || null,
      experiencia: value.experiencia.trim() || null,
      formacion: value.formacion.trim() || null
    };

    this.enviarCurriculum(data);
  }

  /**
   * Convertir PDF a Base64
   */
  private convertirArchivoBase64(
    file: File,
    value: {
      curriculum_nombre: string;
      categoria_interes: string;
      habilidades: string;
      experiencia: string;
      formacion: string;
    }
  ): void {

    const reader = new FileReader();

    reader.onload = () => {

      if (typeof reader.result !== 'string') {
        this.error = 'No se pudo leer el archivo.';
        this.cdr.detectChanges();
        return;
      }

      const data: CrearCurriculumRequest = {
        curriculum_nombre: value.curriculum_nombre.trim(),
        categoria_interes: value.categoria_interes.trim(),
        habilidades: value.habilidades.trim() || null,
        experiencia: value.experiencia.trim() || null,
        formacion: value.formacion.trim() || null,
        curriculum_archivo: reader.result
      };

      this.enviarCurriculum(data);
    };

    reader.onerror = () => {
      this.error = 'No se pudo leer el PDF.';
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  /**
   * Crear o actualizar curriculum
   */
  private enviarCurriculum(
    data: CrearCurriculumRequest
  ): void {

    this.guardando = true;
    this.error = '';

    const esEdicion =
      this.editando &&
      this.curriculumSeleccionado !== null;

    const operacion = esEdicion
      ? this.curriculumService.actualizarCurriculum(
          this.curriculumSeleccionado!.curriculum_id,
          data
        )
      : this.curriculumService.crearCurriculum(data);

    operacion
      .pipe(
        finalize(() => {
          this.guardando = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {

          this.mensaje = esEdicion
            ? 'Curriculum actualizado correctamente.'
            : 'Curriculum creado correctamente.';

          /**
           * Limpiar formulario
           */
          this.nuevoCurriculum();

          /**
           * RECARGAR INMEDIATAMENTE LA LISTA
           */
          this.cargarCurriculums();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo guardar el curriculum.';
        }
      });
  }

  /**
   * Eliminar curriculum
   */
  eliminarCurriculum(curriculum: Curriculum): void {

    const confirmar = window.confirm(
      `¿Deseas eliminar "${curriculum.curriculum_nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    this.error = '';

    this.curriculumService
      .eliminarCurriculum(curriculum.curriculum_id)
      .subscribe({

        next: (response) => {

          this.mensaje = response.message;

          if (
            this.curriculumSeleccionado?.curriculum_id ===
            curriculum.curriculum_id
          ) {
            this.nuevoCurriculum();
          }

          /**
           * RECARGAR LISTA DESPUÉS DE ELIMINAR
           */
          this.cargarCurriculums();

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo eliminar el curriculum.';

          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Ver PDF
   */
  verPDF(curriculum: Curriculum): void {

    this.curriculumService
      .obtenerCurriculum(curriculum.curriculum_id)
      .subscribe({

        next: (response) => {

          const pdf =
            response.curriculum.curriculum_archivo;

          if (!pdf) {
            this.error =
              'Este curriculum no tiene un PDF asociado.';

            this.cdr.detectChanges();
            return;
          }

          window.open(pdf, '_blank');
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo abrir el PDF.';

          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Descargar PDF
   */
  descargarPDF(curriculum: Curriculum): void {

    this.curriculumService
      .obtenerCurriculum(curriculum.curriculum_id)
      .subscribe({

        next: (response) => {

          const pdf =
            response.curriculum.curriculum_archivo;

          if (!pdf) {
            this.error =
              'Este curriculum no tiene un PDF asociado.';

            this.cdr.detectChanges();
            return;
          }

          const link = document.createElement('a');

          link.href = pdf;
          link.download =
            `${curriculum.curriculum_nombre}.pdf`;

          document.body.appendChild(link);
          link.click();
          link.remove();
        },

        error: (error) => {

          this.error =
            error?.error?.message ||
            'No se pudo descargar el PDF.';

          this.cdr.detectChanges();
        }
      });
  }
}