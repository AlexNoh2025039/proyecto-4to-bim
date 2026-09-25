import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empresa } from '../../../../core/models/empresa.model';
import { Evaluacion } from '../../../../core/models/evaluacion.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { EvaluacionService } from '../../../../core/services/evaluacion.service';

@Component({
  selector: 'app-companies-evaluations-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './companies-evaluations-form.css',
  templateUrl: './companies-evaluations-form.html',
})
export class CompaniesEvaluationsForm implements OnInit {
  @Output() saveEvaluacion = new EventEmitter<Evaluacion>();
  @Output() cancel = new EventEmitter<void>();

  evaluationForm!: FormGroup;
  empresas: Empresa[] = [];
  submitting = false;
  serverError = '';

  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly evaluacionService = inject(EvaluacionService);

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresas();
  }

  private initForm(): void {
    this.evaluationForm = this.fb.group({
      evaluacion_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['', [Validators.maxLength(100)]],
      empresa_id: [null, [Validators.required, Validators.min(1)]],
    });
  }

  private loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.empresas = Array.isArray(res.empresas) ? res.empresas : [];
      },
      error: () => {
        this.empresas = [];
      },
    });
  }

  onSubmit(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    const value = this.evaluationForm.getRawValue();
    const payload: Evaluacion = {
      evaluacion_nombre: value.evaluacion_nombre.trim(),
      categoria: value.categoria?.trim() || null,
      empresa_id: Number(value.empresa_id),
    };

    this.serverError = '';
    this.submitting = true;

    this.evaluacionService.createEvaluacion(payload).subscribe({
      next: (created) => {
        this.saveEvaluacion.emit(created);
        this.submitting = false;
        this.evaluationForm.reset({
          evaluacion_nombre: '',
          categoria: '',
          empresa_id: null,
        });
      },
      error: (err) => {
        this.submitting = false;
        this.serverError = err?.error?.message || 'No se pudo crear la evaluación.';
      },
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}