import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CandidateProfileView } from '../companies-dashboard/components/candidate-profile-view/candidate-profile-view';
import { EvaluacionService } from '../../core/services/evaluacion.service';

interface Opcion {
  texto: string;
  esCorrecta: boolean;
}

interface Pregunta {
  id: number;
  enunciado: string;
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evaluacionService = inject(EvaluacionService);

  @Input() evaluationName: string = 'Evaluación Técnica de Reforzamiento';
  @Input() candidateName: string = 'Candidato';
  @Input() companyName: string = 'Tech Solutions S.A.';
  @Input() requiredScore: number = 70;
  @Input() totalQuestions: number = 5;
  @Input() description: string = 'Aquí estás para reforzar tus conocimientos y demostrar tu nivel técnico.';

  estado: 'welcome' | 'quiz' | 'result' = 'welcome';

  preguntas: Pregunta[] = [];
  puntajeObtenido: number = 0;
  porcentajeObtenido: number = 0;
  compatibilidadEmpresa: number = 0;
  aprobado: boolean = false;
  candidateId: number = 1;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.candidateId = Number(id);
      this.cargarEvaluacionDesdeBackend(Number(id));
    } else {
      this.cargarPreguntasPrueba();
    }
  }

  private cargarEvaluacionDesdeBackend(evaluacionId: number): void {
    this.evaluacionService.getEvaluacionById(evaluacionId).subscribe({
      next: (evalData: any) => {
        if (evalData) {
          this.evaluationName = evalData.titulo || evalData.vacante_nombre || this.evaluationName;
          this.description = evalData.descripcion || this.description;

          if (evalData.preguntas && evalData.preguntas.length > 0) {
            this.preguntas = evalData.preguntas;
            this.totalQuestions = this.preguntas.length;
          } else {
            this.cargarPreguntasPrueba();
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar la evaluación del servidor:', err);
        this.cargarPreguntasPrueba();
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
    let correctas = 0;

    this.preguntas.forEach(p => {
      if (p.respuestaSeleccionada !== undefined) {
        if (p.opciones[p.respuestaSeleccionada].esCorrecta) {
          correctas++;
        }
      }
    });

    this.puntajeObtenido = correctas;
    this.porcentajeObtenido = Math.round((correctas / this.preguntas.length) * 100);
    this.aprobado = this.porcentajeObtenido >= this.requiredScore;

    this.compatibilidadEmpresa = this.aprobado
      ? Math.min(98, Math.round(this.porcentajeObtenido * 0.9 + 10))
      : Math.round(this.porcentajeObtenido * 0.6);

    this.estado = 'result';
  }

  volverAlHome(): void {
    this.router.navigate(['/home']);
  }

  private cargarPreguntasPrueba(): void {
    this.preguntas = [
      {
        id: 1,
        enunciado: '¿Cuál es la función principal de Angular RxJS Observables?',
        opciones: [
          { texto: 'Manipular directamente el DOM HTML', esCorrecta: false },
          { texto: 'Manejar programación reactiva y flujos de datos asíncronos', esCorrecta: true },
          { texto: 'Crear bases de datos en el cliente', esCorrecta: false },
          { texto: 'Estilar componentes CSS', esCorrecta: false }
        ]
      },
      {
        id: 2,
        enunciado: '¿Qué decorador se utiliza para definir un componente Standalone en Angular?',
        opciones: [
          { texto: '@Injectable()', esCorrecta: false },
          { texto: '@NgModule()', esCorrecta: false },
          { texto: '@Component({ standalone: true })', esCorrecta: true },
          { texto: '@Directive()', esCorrecta: false }
        ]
      },
      {
        id: 3,
        enunciado: '¿Cuál de los siguientes métodos HTTP se utiliza generalmente para actualizar un recurso existente?',
        opciones: [
          { texto: 'GET', esCorrecta: false },
          { texto: 'POST', esCorrecta: false },
          { texto: 'PUT / PATCH', esCorrecta: true },
          { texto: 'DELETE', esCorrecta: false }
        ]
      },
      {
        id: 4,
        enunciado: '¿Qué comando de Git se utiliza para crear y cambiarse inmediatamente a una nueva rama?',
        opciones: [
          { texto: 'git checkout -b <nombre-rama>', esCorrecta: true },
          { texto: 'git branch create <nombre-rama>', esCorrecta: false },
          { texto: 'git push origin <nombre-rama>', esCorrecta: false },
          { texto: 'git commit -m <nombre-rama>', esCorrecta: false }
        ]
      },
      {
        id: 5,
        enunciado: '¿Qué significa el principio de responsabilidad única (Single Responsibility Principle) en SOLID?',
        opciones: [
          { texto: 'Una clase debe tener una sola razón para cambiar', esCorrecta: true },
          { texto: 'Un proyecto solo debe tener un archivo principal', esCorrecta: false },
          { texto: 'Solo un desarrollador debe trabajar en cada archivo', esCorrecta: false },
          { texto: 'Cada función debe tener máximo 10 líneas', esCorrecta: false }
        ]
      }
    ];

    this.totalQuestions = this.preguntas.length;
  }
}