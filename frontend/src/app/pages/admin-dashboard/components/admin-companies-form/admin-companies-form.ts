<<<<<<< HEAD
import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-admin-companies-form',
  styleUrl: './admin-companies-form.css',
  templateUrl: './admin-companies-form.html',
})
export class AdminCompaniesForm {}
=======
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../../../core/services/empresa.service';

@Component({
  selector: 'app-admin-companies-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-companies-form.html',
  styleUrls: ['./admin-companies-form.css']
})
export class AdminCompaniesFormComponent implements OnInit {
  @Input() empresaToEdit: EmpresaService | null = null;
  @Output() saveEmpresa = new EventEmitter<EmpresaService>();
  @Output() cancel = new EventEmitter<void>();

  companyForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    if (this.empresaToEdit) {
      this.companyForm.patchValue(this.empresaToEdit);
    }
  }

  initForm(): void {
    this.companyForm = this.fb.group({
      empresa_id: [null],
      empresa_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      empresa_descripcion: [''],
      empresa_direccion: [''],
      empresa_telefono: ['', [Validators.pattern('^[0-9+ ]{8,15}$')]],
      empresa_correo: ['', [Validators.required, Validators.email]],
      empresa_nit: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.companyForm.valid) {
      this.saveEmpresa.emit(this.companyForm.value);
    } else {
      this.companyForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
>>>>>>> b24d88345a03181cacb5d7e9b09288bf6491a786
