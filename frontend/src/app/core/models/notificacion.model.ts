export interface Notificacion {
    notificacion_id?: number;
    titulo: string;
    descripcion?: string;
    tipo: string;
    fecha?: string;
    estado?: boolean;
    usuario_id: number;
}

export interface NotificacionResponse {
    notificacion: Notificacion;
}

export interface NotificacionesResponse {
    notificaciones: Notificacion[];
}

export interface CreateNotificacionRequest {
    titulo: string;
    descripcion?: string;
    tipo: string;
    estado?: boolean;
    usuario_id: number;
}
