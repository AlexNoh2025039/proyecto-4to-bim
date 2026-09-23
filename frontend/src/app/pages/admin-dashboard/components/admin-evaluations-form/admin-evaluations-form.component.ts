import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router'; // Directiva de ruteo agregada
import { Empresa } from '../../../../core/models/empresa.model';
import { Evaluacion } from '../../../../core/models/evaluacion.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { EvaluacionService } from '../../../../core/services/evaluacion.service';

@Component({
  selector: 'app-admin-evaluations-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrl: './admin-evaluations-form.css',
  templateUrl: './admin-evaluations-form.html',
})
export class AdminEvaluationsForm implements OnInit {
  @Input() evaluacionToEdit: Evaluacion | null = null;
  @Output() saveEvaluacion = new EventEmitter<Evaluacion>();
  @Output() cancel = new EventEmitter<void>();

  evaluationForm!: FormGroup;
  empresas: Empresa[] = [];
  loadingEmpresas = false;
  submitting = false;
  serverError = '';

  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly evaluacionService = inject(EvaluacionService);

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresas();

    if (this.evaluacionToEdit) {
      this.evaluationForm.patchValue({
        ...this.evaluacionToEdit,
        empresa_id: this.evaluacionToEdit.empresa_id ?? null,
      });
    }
  }

  initForm(): void {
    this.evaluationForm = this.fb.group({
      evaluacion_id: [null],
      evaluacion_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['', [Validators.maxLength(100)]],
      empresa_id: [null, [Validators.required, Validators.min(1)]],
    });
  }

  loadEmpresas(): void {
    this.loadingEmpresas = true;
    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.empresas = Array.isArray(res.empresas) ? res.empresas : [];
        this.loadingEmpresas = false;
      },
      error: () => {
        this.empresas = [];
        this.loadingEmpresas = false;
      }
    });
  }

  onSubmit(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    const value = this.evaluationForm.value;
    const payload: Evaluacion = {
      ...value,
      empresa_id: Number(value.empresa_id),
      categoria: value.categoria?.trim() || null,
      evaluacion_nombre: value.evaluacion_nombre.trim(),
    };

    this.serverError = '';
    this.submitting = true;

    const request$ = payload.evaluacion_id
      ? this.evaluacionService.updateEvaluacion(payload.evaluacion_id, payload)
      : this.evaluacionService.createEvaluacion(payload);

    request$.subscribe({
      next: (created) => {
        this.saveEvaluacion.emit(created);
        this.submitting = false;
        this.evaluationForm.reset({
          evaluacion_id: null,
          evaluacion_nombre: '',
          categoria: '',
          empresa_id: null,
        });
      },
      error: (err) => {
        this.submitting = false;
        this.serverError = err?.error?.message || 'No se pudo guardar la evaluación.';
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}