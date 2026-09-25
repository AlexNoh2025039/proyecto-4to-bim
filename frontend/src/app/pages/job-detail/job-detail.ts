import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { VacanteService } from '../../core/services/vacante.service';
import { PostulacionService } from '../../core/services/postulacion.service';
import { Vacante, VacanteResponse } from '../../core/models/vacante.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css'
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly detector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly vacanteService = inject(VacanteService);
  private readonly postulacionService = inject(PostulacionService);

  vacante: Vacante | null = null;
  
  loading: boolean = true;
  postulando: boolean = false;
  yaPostulado: boolean = false;

  errorMsg: string = '';
  successMsg: string = '';

  ngOnInit(): void {
 const id = Number(this.route.snapshot.paramMap.get('id'));
 if(id){
  this.cargarDetalleVacante(id);
 }
  }

  cargarDetalleVacante(id: number): void {
    this.loading = true;

    this.vacanteService.getVacanteById(id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.detector.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {

console.log('respuesta: ', res)

         if(res && res.vacante){
          this.vacante = res.vacante;
         }else {
          this.vacante = res;
         }

         this.detector.detectChanges();
        },
        error: (err) => {
          console.error('Fallo HTTP: ', err);
          this.errorMsg = 'No se pudo obtener la vacante';
          this.detector.detectChanges();
        }
      });
  }

  postularme(): void {
    if (!this.vacante?.vacante_id) return;

    this.postulando = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = {
      vacante_id: Number(this.vacante.vacante_id),
      porcentaje_compatibilidad: 0
    };

    this.postulacionService.postPostulacion(payload)
      .pipe(
        finalize(() => {
          this.postulando = false;
          this.detector.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMsg = 'Te has postulado exitosamente a esta oferta.';
          this.yaPostulado = true;
          this.detector.detectChanges();
        },
        error: (err) => {
          console.error('Error al postularse:', err);
          this.errorMsg = err?.error?.message || 'No se pudo completar la postulacion.';
          this.detector.detectChanges();
        }
      });
  }
}