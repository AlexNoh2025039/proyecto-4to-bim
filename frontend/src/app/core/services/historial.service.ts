import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HistorialData, HistorialesResponse, HistorialResponse } from '../models/historial.model';

@Injectable({
    providedIn: 'root',
})
export class HistorialService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/historial`;

    getHistoriales(): Observable<HistorialesResponse> {
        return this.http.get<HistorialesResponse>(`${this.apiUrl}/`);
    }

    getHistorial(id: number): Observable<HistorialResponse> {
        return this.http.get<HistorialResponse>(`${this.apiUrl}/${id}`);
    }

    postHistorial(historial: HistorialData): Observable<HistorialResponse> {
        return this.http.post<HistorialResponse>(`${this.apiUrl}/post`, historial)
    }

    putHistorial(id: number, historial: HistorialData): Observable<HistorialResponse>{
        return this.http.put<HistorialResponse>(`${this.apiUrl}/${id}`, historial);
    }

    deleteHistorial(id:number): Observable<{message: string}> {
        return this.http.delete<{message: string}>(`${this.apiUrl}/${id}`)
    }
}
