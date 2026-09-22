import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CreateNotificacionRequest,
    NotificacionResponse,
    NotificacionesResponse
} from '../models/notificacion.model';

@Injectable({
    providedIn: 'root'
})
export class NotificacionService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/notificaciones`;

    getNotificaciones(usuarioId?: number): Observable<NotificacionesResponse> {
        const params = usuarioId ? { usuario_id: usuarioId.toString() } : {};
        return this.http.get<NotificacionesResponse>(this.apiUrl, { params });
    }

    getNotificacionById(id: number): Observable<NotificacionResponse> {
        return this.http.get<NotificacionResponse>(`${this.apiUrl}/${id}`);
    }

    createNotificacion(notificacion: CreateNotificacionRequest): Observable<NotificacionResponse> {
        return this.http.post<NotificacionResponse>(this.apiUrl, notificacion);
    }

    updateNotificacion(id: number, notificacion: CreateNotificacionRequest): Observable<NotificacionResponse> {
        return this.http.put<NotificacionResponse>(`${this.apiUrl}/${id}`, notificacion);
    }

    deleteNotificacion(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }
}
