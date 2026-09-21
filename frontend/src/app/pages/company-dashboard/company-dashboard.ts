import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VacanteService } from '../../core/services/vacante.service';
import { Vacante } from '../../core/models/vacante.model';
import { JobCardComponent } from '../../shared/components/job-card/job-card';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JobCardComponent],
  templateUrl: './company-dashboard.html',
  styleUrl: './company-dashboard.css'
})
export class CompanyDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vacanteService = inject(VacanteService);

  vacantes: Vacante[] = [];
  vacanteForm!: FormGroup;
  isEditing: boolean = false;
  selectedVacanteId: number | null = null;
  empresaId: number = 1;

  ngOnInit(): void {
    this.initForm();
    this.loadVacantes();
  }

  private initForm(): void {
    this.vacanteForm = this.fb.group({
      vacante_nombre: ['', [Validators.required]],
      vacante_descripcion: [''],
      habilidades_requeridas: [''],
      categoria: [''],
      salario: [null, [Validators.min(0)]],
      ubicacion: [''],
      tipo_jornada: ['Tiempo Completo'],
      estado: [true]
    });
  }

  loadVacantes(): void {
    this.vacanteService.getVacantes().subscribe({
      next: (res) => {
        this.vacantes = res.vacantes || [];
      },
      error: (err) => console.error('Error al obtener vacantes', err)
    });
  }

  onSubmit(): void {
    if (this.vacanteForm.invalid) return;

    const vacanteData: Vacante = {
      ...this.vacanteForm.value,
      empresa_id: this.empresaId
    };

    if (this.isEditing && this.selectedVacanteId) {
      this.vacanteService.putVacante(this.selectedVacanteId, vacanteData).subscribe({
        next: () => {
          this.resetForm();
          this.loadVacantes();
        },
        error: (err) => console.error('Error al actualizar la vacante', err)
      });
    } else {
      this.vacanteService.postVacante(vacanteData).subscribe({
        next: () => {
          this.resetForm();
          this.loadVacantes();
        },
        error: (err) => console.error('Error al crear la vacante', err)
      });
    }
  }

  onEdit(vacante: Vacante): void {
    if (!vacante.vacante_id) return;
    this.isEditing = true;
    this.selectedVacanteId = vacante.vacante_id;
    this.vacanteForm.patchValue({
      vacante_nombre: vacante.vacante_nombre,
      vacante_descripcion: vacante.vacante_descripcion,
      habilidades_requeridas: vacante.habilidades_requeridas,
      categoria: vacante.categoria,
      salario: vacante.salario,
      ubicacion: vacante.ubicacion,
      tipo_jornada: vacante.tipo_jornada,
      estado: vacante.estado
    });
  }

  onDelete(id: number): void {
    if (confirm('Esta seguro de eliminar esta vacante?')) {
      this.vacanteService.deleteVacante(id).subscribe({
        next: () => this.loadVacantes(),
        error: (err) => console.error('Error al eliminar la vacante', err)
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedVacanteId = null;
    this.vacanteForm.reset({
      tipo_jornada: 'Tiempo Completo',
      estado: true
    });
  }
}