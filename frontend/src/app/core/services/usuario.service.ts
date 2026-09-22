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
  ActualizarUsuarioAdminRequest,
  ActualizarUsuarioRequest,
  CambiarPasswordAdminRequest,
  CambiarPasswordRequest,
  UsuarioResponse,
  UsuariosResponse
} from '../../core/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/usuarios`;

  obtenerMiPerfil():
    Observable<UsuarioResponse> {

    return this.http.get<UsuarioResponse>(
      `${this.apiUrl}/me`
    );
  }

  actualizarMiPerfil(
    data: ActualizarUsuarioRequest
  ): Observable<UsuarioResponse> {

    return this.http.put<UsuarioResponse>(
      `${this.apiUrl}/me`,
      data
    );
  }

  cambiarMiPassword(
    data: CambiarPasswordRequest
  ): Observable<{ message: string }> {

    return this.http.put<{ message: string }>(
      `${this.apiUrl}/me/password`,
      data
    );
  }

  actualizarFotoPerfil(
    usuario_perfil: string | null
  ): Observable<
    UsuarioResponse & { message: string }
  > {

    return this.http.put<
      UsuarioResponse & { message: string }
    >(
      `${this.apiUrl}/me/perfil`,
      {
        usuario_perfil
      }
    );
  }

  eliminarMiCuenta():
    Observable<{ message: string }> {

    return this.http.delete<{
      message: string
    }>(
      `${this.apiUrl}/me`
    );
  }

  obtenerUsuarios():
    Observable<UsuariosResponse> {

    return this.http.get<UsuariosResponse>(
      this.apiUrl
    );
  }

  obtenerUsuario(
    id: number
  ):
    Observable<UsuarioResponse> {

    return this.http.get<UsuarioResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  actualizarUsuario(
    id: number,
    data: ActualizarUsuarioAdminRequest
  ):
    Observable<UsuarioResponse> {

    return this.http.put<UsuarioResponse>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  cambiarEstado(
    id: number,
    estado: boolean
  ):
    Observable<
      UsuarioResponse & { message: string }
    > {

    return this.http.patch<
      UsuarioResponse & { message: string }
    >(
      `${this.apiUrl}/${id}/estado`,
      { estado }
    );
  }

  cambiarPasswordAdmin(
    id: number,
    data: CambiarPasswordAdminRequest
  ):
    Observable<{ message: string }> {

    return this.http.patch<{
      message: string
    }>(
      `${this.apiUrl}/${id}/password`,
      data
    );
  }

  eliminarUsuario(
    id: number
  ):
    Observable<{ message: string }> {

    return this.http.delete<{
      message: string
    }>(
      `${this.apiUrl}/${id}`
    );
  }
}