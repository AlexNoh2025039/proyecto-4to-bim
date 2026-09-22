import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BancoPreguntas, BancoPreguntasResponse } from '../models/banco-preguntas.model';

@Injectable({
  providedIn: 'root'
})
export class BancoPreguntasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/banco-preguntas'; 
  
  getPreguntas(): Observable<BancoPreguntas[]> {
    return this.http.get<BancoPreguntasResponse>(this.apiUrl).pipe(
      map(res => res.preguntas || [])
    );
  }

  getPreguntaById(id: number): Observable<BancoPreguntas> {
    return this.http.get<BancoPreguntasResponse>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (!res.pregunta) {
          throw new Error('Pregunta no encontrada');
        }
        return res.pregunta;
      })
    );
  }

  createPregunta(pregunta: BancoPreguntas): Observable<BancoPreguntas> {
    return this.http.post<BancoPreguntasResponse>(this.apiUrl, pregunta).pipe(
      map(res => res.pregunta!)
    );
  }

  updatePregunta(id: number, pregunta: BancoPreguntas): Observable<BancoPreguntas> {
    return this.http.put<BancoPreguntasResponse>(`${this.apiUrl}/${id}`, pregunta).pipe(
      map(res => res.pregunta!)
    );
  }

  deletePregunta(id: number): Observable<void> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }
}