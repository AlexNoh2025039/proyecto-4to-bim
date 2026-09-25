import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vacante, VacanteResponse, VacantesResponse } from '../models/vacante.model';

@Injectable({
  providedIn: 'root'
})
export class VacanteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vacantes`;

  getVacantes(): Observable<VacantesResponse> {
    return this.http.get<VacantesResponse>(this.apiUrl);
  }

  getVacanteById(id: number): Observable<VacanteResponse> {
    return this.http.get<VacanteResponse>(`${this.apiUrl}/${id}`);
  }

  postVacante(vacante: Vacante): Observable<VacanteResponse> {
    return this.http.post<VacanteResponse>(this.apiUrl, vacante);
  }

  putVacante(id: number, vacante: Vacante): Observable<VacanteResponse> {
    return this.http.put<VacanteResponse>(`${this.apiUrl}/${id}`, vacante);
  }

  deleteVacante(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}