import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
 
import { AuthService } from '../../core/services/auth.service';
import { VacanteService } from '../../core/services/vacante.service';
import { Vacante } from '../../core/models/vacante.model';
 
import { JobCardComponent } from '../../shared/components/job-card/job-card';
 
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, JobCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly vacanteService = inject(VacanteService);
 
  readonly usuario = this.authService.currentUsuario;
 
  readonly vacantes = signal<Vacante[]>([]);
  readonly loadingVacantes = signal<boolean>(false);
 
  ngOnInit(): void {
    const role = this.usuario()?.usuario_rol;
 
    if (role === 'Candidato') {
      this.cargarVacantes();
    }
  }
 
  private cargarVacantes(): void {
    this.loadingVacantes.set(true);
    this.vacanteService.getVacantes().subscribe({
      next: (data: any) => {
        const lista = Array.isArray(data) ? data : (data.vacantes || []);
        this.vacantes.set(lista);
        this.loadingVacantes.set(false);
      },
      error: (err) => {
        console.error('Error al cargar vacantes:', err);
        this.loadingVacantes.set(false);
      }
    });
  }
}