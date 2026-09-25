import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Evaluacion, EvaluacionResponse } from '../models/evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/evaluaciones`;

  getEvaluaciones(): Observable<Evaluacion[]> {
    return this.http.get<EvaluacionResponse>(this.apiUrl).pipe(
      map((res: any) => res.evaluaciones || [])
    );
  }

  getEvaluacionById(id: number): Observable<Evaluacion> {
    return this.http.get<EvaluacionResponse>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => {
        if (!res.evaluacion) {
          throw new Error('Evaluación no encontrada');
        }
        return res.evaluacion;
      })
    );
  }

  createEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.post<EvaluacionResponse>(this.apiUrl, evaluacion).pipe(
      map((res: any) => res.evaluacion!)
    );
  }

  updateEvaluacion(id: number, evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.put<EvaluacionResponse>(`${this.apiUrl}/${id}`, evaluacion).pipe(
      map((res: any) => res.evaluacion!)
    );
  }

  deleteEvaluacion(id: number): Observable<void> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }

  guardarResultado(resultado: { candidato_id: number; evaluacion_id: number; puntaje: number; porcentaje: number; aprobado: boolean }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/resultados`, resultado);
  }

  getRankingGeneral(): Observable<any[]> {
    return this.http.get<{ ranking: any[] }>(`${environment.apiUrl}/resultados/ranking/general`).pipe(
      map((res: any) => res.ranking || [])
    );
  }
}