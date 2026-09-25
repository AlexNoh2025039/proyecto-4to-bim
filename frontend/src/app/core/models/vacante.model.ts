export interface Vacante {
  vacante_id?: number;
  vacante_nombre: string;
  vacante_descripcion?: string;
  habilidades_requeridas?: string;
  categoria?: string;
  salario?: number;
  ubicacion?: string;
  tipo_jornada?: 'Tiempo Completo' | 'Medio Tiempo' | 'Freelance' | 'Temporal';
  fecha_publicacion?: string;
  estado?: boolean;
  empresa_id: number;
  empresa_nombre?: string;
}

export interface VacanteResponse {
  vacante: Vacante;
}

export interface VacantesResponse {
  vacantes: Vacante[];
}