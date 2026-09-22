export interface Curriculum {
  curriculum_id: number;

  curriculum_nombre: string;
  categoria_interes: string;

  habilidades: string | null;
  experiencia: string | null;
  formacion: string | null;

  curriculum_archivo?: string | null;

  fecha_subida?: string;

  usuario_id: number;

  usuario_nombre?: string;
  usuario_apellido?: string;

  tiene_archivo?: boolean;
}

export interface CrearCurriculumRequest {
  curriculum_nombre: string;
  categoria_interes: string;
  habilidades: string | null;
  experiencia: string | null;
  formacion: string | null;
  curriculum_archivo?: string | null;
}

export interface CurriculumResponse {
  curriculum: Curriculum;
}

export interface CurriculumsResponse {
  curriculums: Curriculum[];
}