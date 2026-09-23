import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Usuario } from '../../../../core/models/auth.model';
import { Curriculum } from '../../../../core/models/curriculum.model';
import { CurriculumService } from '../../../../core/services/curriculum.service';
import { UsuarioService } from '../../../../core/services/usuario.service';

@Component({
  selector: 'app-candidate-profile-view',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './candidate-profile-view.css',
  templateUrl: './candidate-profile-view.html',
})
export class CandidateProfileView implements OnInit {
  candidate: Usuario | null = null;
  curriculums: Curriculum[] = [];
  loading = false;
  error = '';

  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly curriculumService = inject(CurriculumService);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));

      if (!id || Number.isNaN(id)) {
        this.error = 'Perfil del candidato no válido.';
        return;
      }

      this.loadCandidate(id);
    });
  }

  private loadCandidate(id: number): void {
    this.loading = true;
    this.error = '';

    this.usuarioService.obtenerUsuario(id).subscribe({
      next: (userRes) => {
        this.candidate = userRes.usuario;

        this.curriculumService.obtenerTodos().subscribe({
          next: (curriculumRes) => {
            this.curriculums = (curriculumRes.curriculums || []).filter((item) => item.usuario_id === id);
            this.loading = false;
          },
          error: () => {
            this.curriculums = [];
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil del candidato.';
        this.loading = false;
      },
    });
  }
}