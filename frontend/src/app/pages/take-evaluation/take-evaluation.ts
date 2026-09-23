import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-take-evaluation',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './take-evaluation.css',
  templateUrl: './take-evaluation.html',
})
export class TakeEvaluation {
  @Input() evaluationName: string = 'Evaluación de reforzamiento';
  @Input() candidateName: string = 'Candidato';
  @Input() requiredScore: number = 70;
  @Input() totalQuestions: number = 10;
  @Input() description: string = 'Aquí estás para reforzar tus conocimientos y demostrar si puedes continuar en el proceso.';

  onStart(): void {
    console.log('Iniciando evaluación:', this.evaluationName);
  }
}
