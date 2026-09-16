export interface Historial {
    historial_id: number;
    descripcion: string;
    fecha: string;
    postulacion_id: number;
    created_at: string;
}

export interface HistorialData {
    descripcion: string;
    postulacion_id: number;
    fecha?: string;
}

export interface HistorialResponse {
    historial: Historial;
}

export interface HistorialesResponse {
    historial: Historial[];
}