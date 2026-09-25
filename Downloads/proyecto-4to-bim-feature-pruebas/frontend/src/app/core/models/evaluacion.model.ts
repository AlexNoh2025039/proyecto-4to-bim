export interface Evaluacion {
  evaluacion_id?: number;
  evaluacion_nombre: string;
  categoria?: string | null;
  empresa_id: number;
  empresa_nombre?: string;
}

export interface EvaluacionResponse {
  evaluaciones?: Evaluacion[];
  evaluacion?: Evaluacion;
  message?: string;
}