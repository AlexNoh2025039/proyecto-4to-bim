import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, EmpresaResponse, EmpresasResponse } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/empresas`;

  getEmpresas(): Observable<EmpresasResponse> {
    return this.http.get<EmpresasResponse>(this.apiUrl);
  }

  getEmpresaById(id: number): Observable<EmpresaResponse> {
    return this.http.get<EmpresaResponse>(`${this.apiUrl}/${id}`);
  }

  postEmpresa(empresa: Empresa): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(this.apiUrl, empresa);
  }

  putEmpresa(id: number, empresa: Empresa): Observable<EmpresaResponse> {
    return this.http.put<EmpresaResponse>(`${this.apiUrl}/${id}`, empresa);
  }

  deleteEmpresa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}