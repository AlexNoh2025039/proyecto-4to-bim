import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BancoPreguntas } from '../../../../core/models/banco-preguntas.model';
import { BancoPreguntasService } from '../../../../core/services/banco-preguntas.service';

@Component({
  selector: 'app-companies-questions-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './companies-questions-form.css',
  templateUrl: './companies-questions-form.html',
})
export class CompaniesQuestionsForm {
  @Output() savePregunta = new EventEmitter<BancoPreguntas>();
  @Output() cancel = new EventEmitter<void>();

  questionForm!: FormGroup;
  submitting = false;
  serverError = '';

  private readonly fb = inject(FormBuilder);
  private readonly bancoPreguntasService = inject(BancoPreguntasService);

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.questionForm = this.fb.group({
      pregunta: ['', [Validators.required, Validators.maxLength(255)]],
      categoria: ['', [Validators.required, Validators.maxLength(100)]],
      opcion_1: ['', [Validators.required]],
      opcion_2: ['', [Validators.required]],
      opcion_3: ['', [Validators.required]],
      opcion_4: ['', [Validators.required]],
      respuesta_correcta: ['', [Validators.required]],
    });
  }

  private buildOptions(): string[] {
    return [
      this.questionForm.value.opcion_1,
      this.questionForm.value.opcion_2,
      this.questionForm.value.opcion_3,
      this.questionForm.value.opcion_4,
    ]
      .map((value: string) => (value ?? '').trim())
      .filter((value: string) => value.length > 0);
  }

  onSubmit(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const opciones = this.buildOptions();
    const respuestaCorrecta = (this.questionForm.value.respuesta_correcta ?? '').trim();

    if (opciones.length < 2) {
      this.serverError = 'Debes ingresar al menos dos opciones.';
      return;
    }

    if (!opciones.includes(respuestaCorrecta)) {
      this.serverError = 'La respuesta correcta debe coincidir con una de las opciones ingresadas.';
      return;
    }

    const payload: BancoPreguntas = {
      pregunta: this.questionForm.value.pregunta.trim(),
      categoria: this.questionForm.value.categoria.trim(),
      opciones,
      respuesta_correcta: respuestaCorrecta,
    };

    this.serverError = '';
    this.submitting = true;

    this.bancoPreguntasService.createPregunta(payload).subscribe({
      next: (created) => {
        this.savePregunta.emit(created);
        this.submitting = false;
        this.questionForm.reset({
          pregunta: '',
          categoria: '',
          opcion_1: '',
          opcion_2: '',
          opcion_3: '',
          opcion_4: '',
          respuesta_correcta: '',
        });
      },
      error: (err) => {
        this.submitting = false;
        this.serverError = err?.error?.message || 'No se pudo guardar la pregunta.';
      },
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}