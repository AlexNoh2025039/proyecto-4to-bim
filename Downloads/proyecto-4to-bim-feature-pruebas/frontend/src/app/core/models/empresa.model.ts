export interface Empresa {
  empresa_id?: number;
  empresa_nombre: string;
  empresa_descripcion?: string;
  empresa_correo: string;
  empresa_logo?: any;
  empresa_telefono?: string;
  empresa_nit?: string;
  empresa_direccion?: string;
  usuario_admin: number;
}

export interface EmpresaResponse {
  empresa: Empresa;
}

export interface EmpresasResponse {
  empresas: Empresa[];
}