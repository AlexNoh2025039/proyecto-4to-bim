import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Evaluacion, EvaluacionResponse } from '../models/evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/evaluaciones';

  getEvaluaciones(): Observable<Evaluacion[]> {
    return this.http.get<EvaluacionResponse>(this.apiUrl).pipe(
      map(res => res.evaluaciones || [])
    );
  }

  getEvaluacionById(id: number): Observable<Evaluacion> {
    return this.http.get<EvaluacionResponse>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (!res.evaluacion) {
          throw new Error('Evaluación no encontrada');
        }
        return res.evaluacion;
      })
    );
  }

  createEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.post<EvaluacionResponse>(this.apiUrl, evaluacion).pipe(
      map(res => res.evaluacion!)
    );
  }

  updateEvaluacion(id: number, evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.put<EvaluacionResponse>(`${this.apiUrl}/${id}`, evaluacion).pipe(
      map(res => res.evaluacion!)
    );
  }

  deleteEvaluacion(id: number): Observable<void> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}