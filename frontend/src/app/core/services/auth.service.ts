import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    LoginRequest,
    LoginResponse, 
    RegisterRequest, 
    RegisterResponse, 
    Usuario
} from '../models/auth.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly tokenKey = 'auth_token';
    private readonly usuarioKey = 'auth_usuario';

    readonly currentUsuario = signal<Usuario | null> (
        this.getStoredUsario()
    );

    constructor() {
        if(!this.isAuthenticated()) {
            this.clearSession();
        }
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        const body: LoginRequest = {usuario_correo: credentials.usuario_correo.trim(), usuario_password: credentials.usuario_password };

        return this.http
        .post<LoginResponse>(
            `${environment.apiUrl}/auth/login`, body
        )
        .pipe(
            tap((response) => {this.saveSession(response);
            })
        );
    }

    register(data: RegisterRequest): Observable <RegisterResponse> {
        const body: RegisterRequest = {
            usuario_nombre: data.usuario_nombre.trim(),
            usuario_apellido: data.usuario_apellido.trim(),
            usuario_correo: data.usuario_correo.trim().toLowerCase(),
            usuario_password: data.usuario_password,
            usuario_rol: data.usuario_rol,
            usuario_telefono: data.usuario_telefono?.trim(),
            usuario_dpi: data.usuario_dpi?.trim(),
            usuario_profesion: data.usuario_profesion?.trim(),
        };

        return this.http
        .post<RegisterResponse>(
            `${environment.apiUrl}/auth/register`, body
        );
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();

        if(!token){
            return false;
        }

        return !this.isTokenExpired(token);
    }

    clearSession(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.usuarioKey);

        this.currentUsuario.set(null);
    }

    updateCurrentUsuario(usuario: Usuario): void {
        localStorage.setItem(
            this.usuarioKey,
            JSON.stringify(usuario)
        );

        this.currentUsuario.set(usuario);
    }

    logout(): void {
        this.clearSession();
    }

    private getStoredUsario(): Usuario | null {
        const storedUsuario = localStorage.getItem(this.usuarioKey);

        if(!storedUsuario) {
            return null;
        }

        try {
            return JSON.parse(storedUsuario) as Usuario;
        } catch (error) {
            localStorage.removeItem(this.usuarioKey);
            return null;
        }
    }

    private isTokenExpired(token: string): boolean {
        try {
            const payloadPart = token.split('.')[1];

            if(!payloadPart) {
                return true;
            }

            const normalizedBase64 = payloadPart
            .replace(/-/g, '+')
            .replace(/_/g, '/');

            const paddedBase64 = normalizedBase64.padEnd(
                Math.ceil(normalizedBase64.length / 4) * 4,
                '='
            );

            const payload = JSON.parse(
                atob(paddedBase64)
            ) as { exp?: number};

            if(!payload.exp) {
                return true;
            }

            return Date.now() >= payload.exp * 1000;
        } catch (error) {
            return true;
        }
    }

    private saveSession(response: LoginResponse): void {
        localStorage.setItem(this.tokenKey, response.token);

        this.updateCurrentUsuario(response.usuario);
    }
}