import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  CrearCurriculumRequest,
  CurriculumResponse,
  CurriculumsResponse
} from '../models/curriculum.model';

@Injectable({
  providedIn: 'root'
})
export class CurriculumService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/curriculums`;

  obtenerMisCurriculums():
    Observable<CurriculumsResponse> {

    return this.http.get<CurriculumsResponse>(
      `${this.apiUrl}/me`
    );
  }

  obtenerCurriculum(
    id: number
  ): Observable<CurriculumResponse> {

    return this.http.get<CurriculumResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  crearCurriculum(
    data: CrearCurriculumRequest
  ): Observable<CurriculumResponse> {

    return this.http.post<CurriculumResponse>(
      this.apiUrl,
      data
    );
  }

  actualizarCurriculum(
    id: number,
    data: CrearCurriculumRequest
  ): Observable<CurriculumResponse> {

    return this.http.put<CurriculumResponse>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  eliminarCurriculum(
    id: number
  ): Observable<{ message: string }> {

    return this.http.delete<{
      message: string
    }>(
      `${this.apiUrl}/${id}`
    );
  }

  obtenerTodos():
    Observable<CurriculumsResponse> {

    return this.http.get<CurriculumsResponse>(
      this.apiUrl
    );
  }
}