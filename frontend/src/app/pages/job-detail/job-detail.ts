import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa } from '../../core/models/empresa.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css'
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);
  private readonly fb = inject(FormBuilder);

  empresas: Empresa[] = [];
  empresa: Empresa | null = null;
  
  loading: boolean = true;
  errorMsg: string = '';
  successMsg: string = '';

  activeFormMode: 'none' | 'create' | 'update' = 'none';
  selectedEmpresaId: number | null = null;

  empresaForm: FormGroup = this.fb.group({
    empresa_nombre: ['', Validators.required],
    empresa_descripcion: [''],
    empresa_correo: ['', [Validators.required, Validators.email]],
    empresa_telefono: [''],
    empresa_nit: [''],
    empresa_direccion: [''],
    usuario_admin: [1, Validators.required]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam) {
      const id = Number(idParam);
      if (id) {
        this.getEmpresaDetail(id);
      } else {
        this.errorMsg = 'ID de empresa no válido.';
        this.loading = false;
      }
    } else {
      this.loading = false;
    }
    
    this.loadAllEmpresas();
  }

  loadAllEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (res: any) => {
        this.empresas = res.empresas || res; 
      },
      error: (err) => {
        console.error('Error al listar empresas', err);
      }
    });
  }

  getEmpresaDetail(id: number): void {
    this.empresaService.getEmpresaById(id).subscribe({
      next: (res: any) => {
        this.empresa = res.empresa || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle de empresa', err);
        this.errorMsg = 'No se encontró la empresa solicitada.';
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.activeFormMode = 'create';
    this.empresaForm.reset({ usuario_admin: 1 });
    this.successMsg = '';
  }

  createEmpresa(): void {
    if (this.empresaForm.invalid) return;

    this.empresaService.postEmpresa(this.empresaForm.value).subscribe({
      next: () => {
        this.successMsg = 'Empresa creada exitosamente.';
        this.loadAllEmpresas();
        this.activeFormMode = 'none';
        this.empresaForm.reset();
      },
      error: (err) => {
        console.error('Error al crear empresa', err);
        this.errorMsg = 'No se pudo crear la empresa.';
      }
    });
  }

  openUpdateForm(emp: Empresa): void {
    this.activeFormMode = 'update';
    this.selectedEmpresaId = emp.empresa_id || null;
    this.successMsg = '';
    
    this.empresaForm.patchValue({
      empresa_nombre: emp.empresa_nombre,
      empresa_descripcion: emp.empresa_descripcion,
      empresa_correo: emp.empresa_correo,
      empresa_telefono: emp.empresa_telefono,
      empresa_nit: emp.empresa_nit,
      empresa_direccion: emp.empresa_direccion,
      usuario_admin: emp.usuario_admin ?? 1
    });
  }

  updateEmpresa(): void {
    if (this.empresaForm.invalid || !this.selectedEmpresaId) return;

    this.empresaService.putEmpresa(this.selectedEmpresaId, this.empresaForm.value).subscribe({
      next: () => {
        this.successMsg = 'Empresa actualizada exitosamente.';
        this.loadAllEmpresas();
        if (this.empresa && this.empresa.empresa_id === this.selectedEmpresaId) {
          this.getEmpresaDetail(this.selectedEmpresaId);
        }
        this.activeFormMode = 'none';
        this.selectedEmpresaId = null;
      },
      error: (err) => {
        console.error('Error al actualizar empresa', err);
        this.errorMsg = 'No se pudo actualizar la empresa.';
      }
    });
  }

  deleteEmpresa(id: number | undefined): void {
    if (!id) return;
    if (confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.successMsg = 'Empresa eliminada correctamente.';
          this.loadAllEmpresas();
          if (this.empresa && this.empresa.empresa_id === id) {
            this.router.navigate(['/home']);
          }
        },
        error: (err) => {
          console.error('Error al eliminar empresa', err);
          this.errorMsg = 'No se pudo eliminar la empresa.';
        }
      });
    }
  }

  cancelForm(): void {
    this.activeFormMode = 'none';
    this.empresaForm.reset();
  }
}