export interface RespuestaEvaluacion {
  respuesta_id?: number;
  usuario_id: number;
  evaluacion_id: number;
  pregunta_id: number;
  respuesta_usuario: string;
  nota_final?: number;
  fecha_realizacion?: string | Date;
  usuario_nombre?: string;
  usuario_apellido?: string;
  evaluacion_nombre?: string;
  pregunta?: string;
}

export interface RespuestaEvaluacionResponse {
  respuestas?: RespuestaEvaluacion[];
  respuesta?: RespuestaEvaluacion;
  message?: string;
}

export interface RankingEvaluacion {
  usuario_id: number;
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_correo: string;
  usuario_telefono: string | null;
  evaluacion_id: number;
  evaluacion_nombre: string;
  empresa_id: number;
  promedio: number;
  total_preguntas: number;
  fecha_realizacion: string;
}