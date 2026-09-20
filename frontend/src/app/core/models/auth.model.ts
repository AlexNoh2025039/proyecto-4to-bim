export type RolUsuario = 'Administrador' | 'Empresa' | 'Candidato';

export interface Usuario {
    //estos podes modificar si lo necesitas
    usuario_id?: number;
    usuario_nombre: string;
    usuario_apellido: string;
    usuario_correo: string;
    usuario_perfil?: any;
    usuario_telefono: string;
    usuario_dpi: string;
    usuario_profesion: string;
    usuario_rol: RolUsuario;
    created_at?: string;

    //no me borres estos por favor que son para el token
    iat?: number;
    exp?: number;
}
//estos podes modificarlos si queres solo que tambien lo haces en el auth.service
export interface LoginRequest {
    usuario_correo: string;
    usuario_password: string;
}

export interface RegisterRequest {
    usuario_nombre: string;
    usuario_apellido: string;
    usuario_correo: string;
    usuario_password: string;
    usuario_rol: RolUsuario;
    usuario_dpi: string;
    usuario_telefono?: string;
     usuario_profesion?: string;
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
}

export interface RegisterResponse {
    usuario: Usuario;
}

export interface UsuarioResponse {
    usuario: Usuario;
}

export interface UsuariosResponse  {
    usuarios: Usuario[];
}
