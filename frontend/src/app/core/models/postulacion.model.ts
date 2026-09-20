export interface Postulacion {
    postulacion_id?: number;
    usuario_id: number;
    vacante_id: number;
    porcentaje_compatibilidad: number;
    fecha_postulacion: string;
    estado: string
    created_at: string
}

export interface PostulacionData {
    usuario_id: number;
    vacante_id: number;
    porcentaje_compatibilidad?: number;
    estado?: string;
    fecha_postulacion?: string;
}

export interface PostulacionResponse {
    postulacion: Postulacion;
}

export interface PostulacionesResponse {
    postulacion: Postulacion[];
}
