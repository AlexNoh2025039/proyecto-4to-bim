export interface BancoPreguntas {
  pregunta_id?: number;
  pregunta: string;
  opciones?: string[] | Record<string, any> | null;
  respuesta_correcta: string;
  categoria: string;
}

export interface BancoPreguntasResponse {
  preguntas?: BancoPreguntas[];
  pregunta?: BancoPreguntas;
  message?: string;
}