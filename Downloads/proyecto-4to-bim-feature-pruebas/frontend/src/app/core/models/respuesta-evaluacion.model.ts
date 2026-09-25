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