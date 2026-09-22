import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vacante } from '../../../../core/models/vacante.model';

@Component({
  selector: 'app-companies-vacancies-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './companies-vacancies-form.html',
  styleUrls: ['./companies-vacancies-form.css']
})
export class CompaniesVacanciesFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() vacanteToEdit: Vacante | null = null;
  @Input() empresaId!: number;
  @Output() saveVacante = new EventEmitter<Vacante>();
  @Output() cancel = new EventEmitter<void>();

  vacanteForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (this.vacanteToEdit) {
      this.vacanteForm.patchValue(this.vacanteToEdit);
    } else if (this.empresaId) {
      this.vacanteForm.patchValue({ empresa_id: this.empresaId });
    }
  }

  initForm(): void {
    this.vacanteForm = this.fb.group({
      vacante_id: [null],
      vacante_nombre: ['', [Validators.required, Validators.maxLength(150)]],
      vacante_descripcion: [''],
      habilidades_requeridas: [''],
      categoria: [''],
      salario: [null, [Validators.min(0)]],
      ubicacion: [''],
      tipo_jornada: ['Tiempo Completo', Validators.required],
      estado: [true],
      empresa_id: [this.empresaId, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.vacanteForm.valid) {
      this.saveVacante.emit(this.vacanteForm.value);
    } else {
      this.vacanteForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}