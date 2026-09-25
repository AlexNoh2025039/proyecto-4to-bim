import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CandidateProfileView } from '../companies-dashboard/components/candidate-profile-view/candidate-profile-view';
import { EvaluacionService } from '../../core/services/evaluacion.service';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { RespuestaEvaluacionService } from '../../core/services/respuesta-evaluacion.service';
import { AuthService } from '../../core/services/auth.service';

interface Opcion {
  texto: string;
}

interface Pregunta {
  id: number;
  enunciado: string;
  respuestaCorrecta: string;
  opciones: Opcion[];
  respuestaSeleccionada?: number;
}

@Component({
  selector: 'app-take-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule, CandidateProfileView],
  styleUrl: './take-evaluation.css',
  templateUrl: './take-evaluation.html',
})
export class TakeEvaluation implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly bancoPreguntasService = inject(BancoPreguntasService);
  private readonly respuestaEvaluacionService = inject(RespuestaEvaluacionService);
  private readonly authService = inject(AuthService);

  evaluationName = '';
  candidateName = '';
  companyName = '';
  categoriaEvaluacion = '';
  readonly requiredScore = 70; // debe coincidir con la nota mínima usada en el ranking

  estado: 'welcome' | 'quiz' | 'result' = 'welcome';
  cargando = true;
  errorCarga = '';
  enviando = false;
  errorEnvio = '';

  preguntas: Pregunta[] = [];
  totalQuestions = 0;
  puntajeObtenido = 0;
  porcentajeObtenido = 0;
  compatibilidadEmpresa = 0;
  aprobado = false;

  evaluacionIdActual = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || !Number.isInteger(id) || id <= 0) {
      this.errorCarga = 'ID de evaluación no válido.';
      this.cargando = false;
      return;
    }

    this.evaluacionIdActual = id;

    const usuario = this.authService.currentUsuario();
    this.candidateName = usuario ? `${usuario.usuario_nombre} ${usuario.usuario_apellido}` : 'Candidato';

    this.cargarEvaluacion();
  }

  private cargarEvaluacion(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.evaluacionService.getEvaluacionById(this.evaluacionIdActual).subscribe({
      next: (evaluacion) => {
        this.evaluationName = evaluacion.evaluacion_nombre;
        this.companyName = evaluacion.empresa_nombre || '';
        this.categoriaEvaluacion = evaluacion.categoria || '';
        this.cargarPreguntas();
      },
      error: (err) => {
        this.errorCarga = err?.error?.message || 'No se pudo cargar la evaluación solicitada.';
        this.cargando = false;
      }
    });
  }

  private cargarPreguntas(): void {
    this.bancoPreguntasService.getPreguntas().subscribe({
      next: (todas) => {
        const filtradas = this.categoriaEvaluacion
          ? todas.filter(p => p.categoria === this.categoriaEvaluacion)
          : todas;

        if (filtradas.length === 0) {
          this.errorCarga = 'Esta evaluación todavía no tiene preguntas configuradas.';
          this.cargando = false;
          return;
        }

        this.preguntas = filtradas.map(p => ({
          id: p.pregunta_id!,
          enunciado: p.pregunta,
          respuestaCorrecta: p.respuesta_correcta,
          opciones: (Array.isArray(p.opciones) ? (p.opciones as string[]) : []).map(texto => ({ texto }))
        }));

        this.totalQuestions = this.preguntas.length;
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = err?.error?.message || 'No se pudieron cargar las preguntas.';
        this.cargando = false;
      }
    });
  }

  onStart(): void {
    this.estado = 'quiz';
  }

  seleccionarRespuesta(indexPregunta: number, indexOpcion: number): void {
    this.preguntas[indexPregunta].respuestaSeleccionada = indexOpcion;
  }

  todasRespondidas(): boolean {
    return this.preguntas.every(p => p.respuestaSeleccionada !== undefined);
  }

  finalizarEvaluacion(): void {
    if (!this.todasRespondidas() || this.enviando) {
      return;
    }

    const usuarioId = this.authService.currentUsuario()?.usuario_id;

    if (!usuarioId) {
      this.errorEnvio = 'No se pudo identificar tu sesión. Vuelve a iniciar sesión e intenta de nuevo.';
      return;
    }

    this.enviando = true;
    this.errorEnvio = '';

    const peticiones = this.preguntas.map(p => {
      const opcion = p.opciones[p.respuestaSeleccionada!];

      return this.respuestaEvaluacionService.registrarRespuesta({
        usuario_id: usuarioId,
        evaluacion_id: this.evaluacionIdActual,
        pregunta_id: p.id,
        respuesta_usuario: opcion.texto
      });
    });

    forkJoin(peticiones).subscribe({
      next: (respuestas) => {
        const notas = respuestas.map(r => Number(r.respuesta.nota_final ?? 0));
        const promedio = notas.reduce((acc, n) => acc + n, 0) / notas.length;

        this.porcentajeObtenido = Math.round(promedio);
        this.puntajeObtenido = notas.filter(n => n >= 100).length;
        this.aprobado = this.porcentajeObtenido >= this.requiredScore;

        this.compatibilidadEmpresa = this.aprobado
          ? Math.min(98, Math.round(this.porcentajeObtenido * 0.9 + 10))
          : Math.round(this.porcentajeObtenido * 0.6);

        this.enviando = false;
        this.estado = 'result';
      },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio = err?.error?.message || 'No se pudo guardar tu evaluación. Intenta nuevamente.';
      }
    });
  }

  volverAlHome(): void {
    this.router.navigate(['/home']);
  }
}