import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PostulacionData, PostulacionesResponse, PostulacionResponse } from '../models/postulacion.model';

@Injectable({
    providedIn: 'root',
})
export class PostulacionService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/postulaciones`;

    getPostulaciones(): Observable<PostulacionesResponse> {
        return this.http.get<PostulacionesResponse>(`${this.apiUrl}/`);
    }

    getPostulacion(id: number): Observable<PostulacionResponse> {
        return this.http.get<PostulacionResponse>(`${this.apiUrl}/${id}`)
    }

    postPostulacion(postulacion: PostulacionData): Observable<PostulacionResponse> {
        return this.http.post<PostulacionResponse>(`${this.apiUrl}/post`, postulacion)
    }

    putPostulacion(id: number, postulacion: PostulacionData): Observable<PostulacionResponse> {
        return this.http.put<PostulacionResponse>(`${this.apiUrl}/${id}`, postulacion)
    }

    deletePostulacion(id: number): Observable<{message: string}> {
        return this.http.delete<{message: string}>(`${this.apiUrl}/${id}`)
    }
}
