import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { Evaluacion } from '../../../../core/models/evaluacion.model';

@Component({
  selector: 'app-companies-evaluations-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './companies-evaluations-form.component.html',
  styleUrls: ['./companies-evaluations-form.component.css']
})
export class CompaniesEvaluationsFormComponent implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() saveEvaluacion = new EventEmitter<Evaluacion>();

  private fb = inject(FormBuilder);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);

  evaluationForm!: FormGroup;
  empresas: Empresa[] = [];
  submitting = false;
  serverError: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresas();
  }

  private initForm(): void {
    this.evaluationForm = this.fb.group({
      evaluacion_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['', [Validators.maxLength(100)]],
      empresa_id: [null, [Validators.required]]
    });
  }

  private loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (res) => {
        this.empresas = res.empresas || [];
      },
      error: () => {
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

    const payload: Evaluacion = this.evaluationForm.value;
    this.saveEvaluacion.emit(payload);
    this.submitting = false;
    this.router.navigate(['/home']);
  }

  onCancel(): void {
    this.cancel.emit();
    this.router.navigate(['/home']);
  }
}