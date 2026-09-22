import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacanteService } from '../../../../core/services/vacante.service';
import { EmpresaService } from '../../../../core/services/empresa.service';

@Component({
  selector: 'app-admin-vacancies-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-vacancies-form.html',
  styleUrls: ['./admin-vacancies-form.css']
})
export class AdminVacanciesFormComponent implements OnInit {
  @Input() vacanteToEdit: VacanteService | null = null;
  @Input() empresasList: EmpresaService[] = [];
  @Output() saveVacante = new EventEmitter<VacanteService>();
  @Output() cancel = new EventEmitter<void>();

  vacancyForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    if (this.vacanteToEdit) {
      this.vacancyForm.patchValue(this.vacanteToEdit);
    }
  }

  initForm(): void {
    this.vacancyForm = this.fb.group({
      vacante_id: [null],
      empresa_id: [null, [Validators.required]],
      vacante_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      vacante_descripcion: [''],
      ubicacion: [''],
      tipo_jornada: ['Tiempo Completo', [Validators.required]],
      salario: [null, [Validators.min(0)]],
      categoria: [''],
      habilidades_requeridas: [''],
      estado: [true]
    });
  }

  onSubmit(): void {
    if (this.vacancyForm.valid) {
      this.saveVacante.emit(this.vacancyForm.value);
    } else {
      this.vacancyForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}