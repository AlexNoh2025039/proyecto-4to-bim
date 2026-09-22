export type RolUsuario =
  | 'Administrador'
  | 'Empresa'
  | 'Candidato';

export type TipoRegistro =
  | 'Candidato'
  | 'Empresa';

export interface Usuario {
  usuario_id?: number;

  usuario_nombre: string;
  usuario_apellido: string;
  usuario_correo: string;

  usuario_perfil?: any;

  usuario_telefono: string | null;
  usuario_dpi: string | null;
  usuario_profesion: string | null;

  usuario_rol: RolUsuario;

  fecha_registro?: string;
  estado?: boolean;

  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  usuario_correo: string;
  usuario_password: string;
}

export interface RegisterRequest {
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_correo: string;
  usuario_password: string;

  usuario_dpi?: string;
  usuario_telefono?: string;
  usuario_profesion?: string;
}

export interface RegisterEmpresaRequest
  extends RegisterRequest {

  empresa_nombre: string;
  empresa_descripcion?: string;
  empresa_correo: string;
  empresa_telefono?: string;
  empresa_nit?: string;
  empresa_direccion?: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface RegisterResponse {
  usuario: Usuario;
}

export interface RegisterEmpresaResponse {
  usuario: Usuario;

  empresa: {
    empresa_id: number;
    empresa_nombre: string;
    empresa_descripcion: string | null;
    empresa_correo: string;
    empresa_telefono: string | null;
    empresa_nit: string | null;
    empresa_direccion: string | null;
    usuario_admin: number;
  };
}

export interface UsuarioResponse {
  usuario: Usuario;
}

export interface UsuariosResponse {
  usuarios: Usuario[];
}