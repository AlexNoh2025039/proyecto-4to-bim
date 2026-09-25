import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RespuestaEvaluacion, RespuestaEvaluacionResponse, RankingEvaluacion } from '../models/respuesta-evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class RespuestaEvaluacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/respuestas-evaluacion`;

  getRespuestas(): Observable<RespuestaEvaluacion[]> {
    return this.http.get<RespuestaEvaluacionResponse>(this.apiUrl).pipe(
      map(res => res.respuestas || [])
    );
  }

  getRanking(): Observable<RankingEvaluacion[]> {
  return this.http.get<{ ranking: RankingEvaluacion[] }>(`${this.apiUrl}/ranking`).pipe(
    map(res => res.ranking || [])
  );
}

  getRespuestaById(id: number): Observable<RespuestaEvaluacion> {
    return this.http.get<RespuestaEvaluacionResponse>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (!res.respuesta) {
          throw new Error('Respuesta no encontrada');
        }
        return res.respuesta;
      })
    );
  }

  registrarRespuesta(respuesta: RespuestaEvaluacion): Observable<{ message?: string; respuesta: RespuestaEvaluacion }> {
    return this.http.post<{ message?: string; respuesta: RespuestaEvaluacion }>(this.apiUrl, respuesta);
  }

  updateRespuesta(id: number, respuesta: RespuestaEvaluacion): Observable<RespuestaEvaluacion> {
    return this.http.put<RespuestaEvaluacionResponse>(`${this.apiUrl}/${id}`, respuesta).pipe(
      map(res => res.respuesta!)
    );
  }

  deleteRespuesta(id: number): Observable<void> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}