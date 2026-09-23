import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { Evaluacion } from '../../../../core/models/evaluacion.model';

@Component({
  selector: 'app-admin-evaluations-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-evaluations-form.component.html',
  styleUrls: ['./admin-evaluations-form.component.css']
})
export class AdminEvaluationsFormComponent implements OnInit {
  @Input() evaluacionToEdit: Evaluacion | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() saveEvaluacion = new EventEmitter<Evaluacion>();

  private fb = inject(FormBuilder);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);

  evaluationForm!: FormGroup;
  empresas: Empresa[] = [];
  loadingEmpresas = false;
  submitting = false;
  serverError: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresas();

    if (this.evaluacionToEdit) {
      this.evaluationForm.patchValue(this.evaluacionToEdit);
    }
  }

  private initForm(): void {
    this.evaluationForm = this.fb.group({
      evaluacion_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['', [Validators.maxLength(100)]],
      empresa_id: [null, [Validators.required]]
    });
  }

  private loadEmpresas(): void {
    this.loadingEmpresas = true;
    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.empresas = res.empresas || [];
        this.loadingEmpresas = false;
      },
      error: () => {
        this.loadingEmpresas = false;
        this.serverError = 'No se pudieron cargar las empresas.';
      }
    });
  }

  onSubmit(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.serverError = null;

    const formData: Evaluacion = this.evaluationForm.value;

    if (this.evaluacionToEdit) {
      formData.evaluacion_id = this.evaluacionToEdit.evaluacion_id;
    }

    this.saveEvaluacion.emit(formData);
    this.submitting = false;
    this.router.navigate(['/home']);
  }

  onCancel(): void {
    this.cancel.emit();
    this.router.navigate(['/home']);
  }
}