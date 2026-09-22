import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();
const ROLES_VALIDOS = ['Administrador', 'Candidato', 'Empresa'];

function normalizarOpcional(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return value;
  }
  const valor = value.trim();
  return valor === '' ? null : valor;
}

function isValidEmail(email) {
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexCorreo.test(email);
}

function validateUsuarioRegistro({
  usuario_nombre,
  usuario_apellido,
  usuario_correo,
  usuario_password,
  usuario_telefono,
  usuario_dpi,
  usuario_profesion
}) {
  if (typeof usuario_nombre !== 'string' || !usuario_nombre.trim()) {
    return 'El nombre del usuario es obligatorio';
  }
  if (usuario_nombre.trim().length > 50) {
    return 'El nombre del usuario no puede superar los 50 caracteres';
  }
  if (typeof usuario_apellido !== 'string' || !usuario_apellido.trim()) {
    return 'El apellido del usuario es obligatorio';
  }
  if (usuario_apellido.trim().length > 50) {
    return 'El apellido del usuario no puede superar los 50 caracteres';
  }
  if (
    typeof usuario_correo !== 'string' ||
    !usuario_correo.trim() ||
    usuario_correo.trim().length > 100 ||
    !isValidEmail(usuario_correo.trim())
  ) {
    return 'Debe proporcionar un correo electrónico válido (máximo 100 caracteres)';
  }
  if (
    typeof usuario_password !== 'string' ||
    !usuario_password ||
    usuario_password.length < 6
  ) {
    return 'La contraseña es obligatoria y debe tener al menos 6 caracteres';
  }
  if (
    usuario_telefono !== null &&
    usuario_telefono !== undefined &&
    typeof usuario_telefono !== 'string'
  ) {
    return 'El teléfono debe ser un texto';
  }
  if (typeof usuario_telefono === 'string' && usuario_telefono.trim().length > 20) {
    return 'El teléfono no puede superar los 20 caracteres';
  }
  if (
    usuario_dpi !== null &&
    usuario_dpi !== undefined &&
    typeof usuario_dpi !== 'string'
  ) {
    return 'El DPI debe ser un texto';
  }
  if (typeof usuario_dpi === 'string' && usuario_dpi.trim().length > 20) {
    return 'El DPI no puede superar los 20 caracteres';
  }
  if (
    usuario_profesion !== null &&
    usuario_profesion !== undefined &&
    typeof usuario_profesion !== 'string'
  ) {
    return 'La profesión debe ser un texto';
  }
  if (
    typeof usuario_profesion === 'string' &&
    usuario_profesion.trim().length > 100
  ) {
    return 'La profesión no puede superar los 100 caracteres';
  }
  return null;
}

function validateUsuarioActualizacion({
  usuario_nombre,
  usuario_apellido,
  usuario_correo,
  usuario_password,
  usuario_telefono,
  usuario_dpi,
  usuario_profesion,
  usuario_rol
}) {
  if (typeof usuario_nombre !== 'string' || !usuario_nombre.trim()) {
    return 'El nombre del usuario es obligatorio';
  }
  if (usuario_nombre.trim().length > 50) {
    return 'El nombre del usuario no puede superar los 50 caracteres';
  }
  if (typeof usuario_apellido !== 'string' || !usuario_apellido.trim()) {
    return 'El apellido del usuario es obligatorio';
  }
  if (usuario_apellido.trim().length > 50) {
    return 'El apellido del usuario no puede superar los 50 caracteres';
  }
  if (
    typeof usuario_correo !== 'string' ||
    !usuario_correo.trim() ||
    usuario_correo.trim().length > 100 ||
    !isValidEmail(usuario_correo.trim())
  ) {
    return 'Debe proporcionar un correo electrónico válido (máximo 100 caracteres)';
  }
  if (
    usuario_password !== undefined &&
    usuario_password !== null &&
    usuario_password !== '' &&
    usuario_password.length < 6
  ) {
    return 'La nueva contraseña debe tener al menos 6 caracteres';
  }
  if (
    usuario_telefono !== null &&
    usuario_telefono !== undefined &&
    typeof usuario_telefono !== 'string'
  ) {
    return 'El teléfono debe ser un texto';
  }
  if (typeof usuario_telefono === 'string' && usuario_telefono.trim().length > 20) {
    return 'El teléfono no puede superar los 20 caracteres';
  }
  if (
    usuario_dpi !== null &&
    usuario_dpi !== undefined &&
    typeof usuario_dpi !== 'string'
  ) {
    return 'El DPI debe ser un texto';
  }
  if (typeof usuario_dpi === 'string' && usuario_dpi.trim().length > 20) {
    return 'El DPI no puede superar los 20 caracteres';
  }
  if (
    usuario_profesion !== null &&
    usuario_profesion !== undefined &&
    typeof usuario_profesion !== 'string'
  ) {
    return 'La profesión debe ser un texto';
  }
  if (
    typeof usuario_profesion === 'string' &&
    usuario_profesion.trim().length > 100
  ) {
    return 'La profesión no puede superar los 100 caracteres';
  }
  if (!ROLES_VALIDOS.includes(usuario_rol)) {
    return 'El rol del usuario no es válido';
  }
  return null;
}

function validateDatosEmpresa({
  empresa_nombre,
  empresa_descripcion,
  empresa_correo,
  empresa_telefono,
  empresa_nit,
  empresa_direccion
}) {
  if (typeof empresa_nombre !== 'string' || !empresa_nombre.trim()) {
    return 'El nombre de la empresa es obligatorio';
  }
  if (empresa_nombre.trim().length > 100) {
    return 'El nombre de la empresa no puede superar los 100 caracteres';
  }
  if (
    typeof empresa_correo !== 'string' ||
    !empresa_correo.trim() ||
    empresa_correo.trim().length > 100 ||
    !isValidEmail(empresa_correo.trim())
  ) {
    return 'El correo de la empresa es obligatorio y debe tener un formato válido';
  }
  if (
    empresa_telefono !== null &&
    empresa_telefono !== undefined &&
    typeof empresa_telefono !== 'string'
  ) {
    return 'El teléfono de la empresa debe ser un texto';
  }
  if (typeof empresa_telefono === 'string' && empresa_telefono.trim().length > 20) {
    return 'El teléfono de la empresa no puede superar los 20 caracteres';
  }
  if (
    empresa_nit !== null &&
    empresa_nit !== undefined &&
    typeof empresa_nit !== 'string'
  ) {
    return 'El NIT debe ser un texto';
  }
  if (typeof empresa_nit === 'string' && empresa_nit.trim().length > 30) {
    return 'El NIT no puede superar los 30 caracteres';
  }
  if (
    empresa_direccion !== null &&
    empresa_direccion !== undefined &&
    typeof empresa_direccion !== 'string'
  ) {
    return 'La dirección debe ser un texto';
  }
  if (
    typeof empresa_direccion === 'string' &&
    empresa_direccion.trim().length > 250
  ) {
    return 'La dirección no puede superar los 250 caracteres';
  }
  if (
    empresa_descripcion !== null &&
    empresa_descripcion !== undefined &&
    typeof empresa_descripcion !== 'string'
  ) {
    return 'La descripción debe ser un texto';
  }
  return null;
}

router.post('/', async (req, res) => {
  const {
    usuario_nombre,
    usuario_apellido,
    usuario_correo,
    usuario_password,
    usuario_telefono,
    usuario_dpi,
    usuario_profesion
  } = req.body;

  const datos = {
    usuario_nombre,
    usuario_apellido,
    usuario_correo,
    usuario_password,
    usuario_telefono: normalizarOpcional(usuario_telefono),
    usuario_dpi: normalizarOpcional(usuario_dpi),
    usuario_profesion: normalizarOpcional(usuario_profesion)
  };

  const validationError = validateUsuarioRegistro(datos);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const passwordHash = await bcrypt.hash(usuario_password, 10);
    const result = await pool.query(
      `INSERT INTO Usuario (
        usuario_nombre,
        usuario_apellido,
        usuario_correo,
        usuario_password,
        usuario_telefono,
        usuario_dpi,
        usuario_profesion,
        usuario_rol
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Candidato')
      RETURNING
        usuario_id,
        usuario_nombre,
        usuario_apellido,
        usuario_correo,
        usuario_telefono,
        usuario_dpi,
        usuario_profesion,
        usuario_rol,
        fecha_registro,
        estado`,
      [
        usuario_nombre.trim(),
        usuario_apellido.trim(),
        usuario_correo.trim().toLowerCase(),
        passwordHash,
        datos.usuario_telefono,
        datos.usuario_dpi,
        datos.usuario_profesion
      ]
    );

    return res.status(201).json({
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando candidato:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        message: 'El correo electrónico o el DPI ya se encuentran registrados.'
      });
    }
    return res.status(500).json({
      message: 'No se pudo crear el usuario'
    });
  }
});

router.post('/empresa', async (req, res) => {
  const {
    usuario_nombre,
    usuario_apellido,
    usuario_correo,
    usuario_password,
    usuario_telefono,
    usuario_dpi,
    usuario_profesion,
    empresa_nombre,
    empresa_descripcion,
    empresa_correo,
    empresa_telefono,
    empresa_nit,
    empresa_direccion
  } = req.body;

  const datosUsuario = {
    usuario_nombre,
    usuario_apellido,
    usuario_correo,
    usuario_password,
    usuario_telefono: normalizarOpcional(usuario_telefono),
    usuario_dpi: normalizarOpcional(usuario_dpi),
    usuario_profesion: normalizarOpcional(usuario_profesion)
  };

  const datosEmpresa = {
    empresa_nombre,
    empresa_descripcion: normalizarOpcional(empresa_descripcion),
    empresa_correo,
    empresa_telefono: normalizarOpcional(empresa_telefono),
    empresa_nit: normalizarOpcional(empresa_nit),
    empresa_direccion: normalizarOpcional(empresa_direccion)
  };

  const errorUsuario = validateUsuarioRegistro(datosUsuario);
  if (errorUsuario) {
    return res.status(400).json({ message: errorUsuario });
  }

  const errorEmpresa = validateDatosEmpresa(datosEmpresa);
  if (errorEmpresa) {
    return res.status(400).json({ message: errorEmpresa });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(usuario_password, 10);
    const usuarioResult = await client.query(
      `INSERT INTO Usuario (
        usuario_nombre,
        usuario_apellido,
        usuario_correo,
        usuario_password,
        usuario_telefono,
        usuario_dpi,
        usuario_profesion,
        usuario_rol
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Empresa')
      RETURNING
        usuario_id,
        usuario_nombre,
        usuario_apellido,
        usuario_correo,
        usuario_telefono,
        usuario_dpi,
        usuario_profesion,
        usuario_rol,
        fecha_registro,
        estado`,
      [
        usuario_nombre.trim(),
        usuario_apellido.trim(),
        usuario_correo.trim().toLowerCase(),
        passwordHash,
        datosUsuario.usuario_telefono,
        datosUsuario.usuario_dpi,
        datosUsuario.usuario_profesion
      ]
    );

    const usuarioAdmin = usuarioResult.rows[0].usuario_id;
    const empresaResult = await client.query(
      `INSERT INTO Empresa (
        empresa_nombre,
        empresa_descripcion,
        empresa_correo,
        empresa_telefono,
        empresa_nit,
        empresa_direccion,
        usuario_admin
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        empresa_id,
        empresa_nombre,
        empresa_descripcion,
        empresa_correo,
        empresa_telefono,
        empresa_nit,
        empresa_direccion,
        usuario_admin`,
      [
        empresa_nombre.trim(),
        datosEmpresa.empresa_descripcion,
        empresa_correo.trim().toLowerCase(),
        datosEmpresa.empresa_telefono,
        datosEmpresa.empresa_nit,
        datosEmpresa.empresa_direccion,
        usuarioAdmin
      ]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      usuario: usuarioResult.rows[0],
      empresa: empresaResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando empresa:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        message: 'El correo del usuario, correo de empresa o NIT ya se encuentra registrado.'
      });
    }
    return res.status(500).json({
      message: 'No se pudo completar el registro de la empresa'
    });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { usuario_correo, usuario_password } = req.body;

  if (
    typeof usuario_correo !== 'string' ||
    !usuario_correo.trim() ||
    typeof usuario_password !== 'string' ||
    !usuario_password
  ) {
    return res.status(400).json({
      message: 'Por favor, ingrese correo y contraseña'
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM Usuario WHERE usuario_correo = $1`,
      [usuario_correo.trim().toLowerCase()]
    );
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    const passwordValida = await bcrypt.compare(
      usuario_password,
      usuario.usuario_password
    );

    if (!passwordValida) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({
        message: 'El servidor no tiene configurada la clave de seguridad'
      });
    }

    const token = jwt.sign(
      {
        usuario_id: usuario.usuario_id,
        usuario_correo: usuario.usuario_correo,
        usuario_rol: usuario.usuario_rol
      },
      secretKey,
      {
        expiresIn: '8h'
      }
    );

    delete usuario.usuario_password;

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario
    });
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({
      message: 'Error interno en el servidor'
    });
  }
});

router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        usuario_id,
        usuario_nombre,
        usuario_apellido,
        usuario_correo,
        usuario_telefono,
        usuario_dpi,
        usuario_profesion,
        usuario_rol,
        fecha_registro,
        estado
       FROM Usuario
       ORDER BY usuario_id ASC`
    );
    res.json({
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      message: 'No se pudieron consultar los usuarios'
    });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El ID del usuario no es válido'
    });
  }

  try {
    const result = await pool.query(
      `SELECT
        usuario_id,
        usuario_nombre,
        usuario_apellido,
        usuario_correo,
        usuario_telefono,
        usuario_dpi,
        usuario_profesion,
        usuario_rol,
        fecha_registro,
        estado
       FROM Usuario
       WHERE usuario_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error consultando usuario:', error);
    res.status(500).json({
      message: 'No se pudo consultar el usuario'
    });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El ID del usuario no es válido'
    });
  }

  const {
    usuario_nombre,
    usuario_apellido,
    usuario_correo,
    usuario_password,
    usuario_perfil,
    usuario_telefono,
    usuario_dpi,
    usuario_profesion,
    usuario_rol,
    estado
  } = req.body;

  const datos = {
    usuario_nombre,
    usuario_apellido,
    usuario_correo,
    usuario_password,
    usuario_telefono: normalizarOpcional(usuario_telefono),
    usuario_dpi: normalizarOpcional(usuario_dpi),
    usuario_profesion: normalizarOpcional(usuario_profesion),
    usuario_rol
  };

  const validationError = validateUsuarioActualizacion(datos);
  if (validationError) {
    return res.status(400).json({
      message: validationError
    });
  }

  try {
    const actualResult = await pool.query(
      `SELECT usuario_password
       FROM Usuario
       WHERE usuario_id = $1`,
      [id]
    );

    if (!actualResult.rows[0]) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    let passwordFinal = actualResult.rows[0].usuario_password;
    if (usuario_password) {
      passwordFinal = await bcrypt.hash(usuario_password, 10);
    }

    const result = await pool.query(
      `UPDATE Usuario
       SET
         usuario_nombre = $1,
         usuario_apellido = $2,
         usuario_correo = $3,
         usuario_password = $4,
         usuario_perfil = $5,
         usuario_telefono = $6,
         usuario_dpi = $7,
         usuario_profesion = $8,
         usuario_rol = $9,
         estado = COALESCE($10, estado)
       WHERE usuario_id = $11
       RETURNING
         usuario_id,
         usuario_nombre,
         usuario_apellido,
         usuario_correo,
         usuario_telefono,
         usuario_dpi,
         usuario_profesion,
         usuario_rol,
         fecha_registro,
         estado`,
      [
        usuario_nombre.trim(),
        usuario_apellido.trim(),
        usuario_correo.trim().toLowerCase(),
        passwordFinal,
        usuario_perfil ?? null,
        datos.usuario_telefono,
        datos.usuario_dpi,
        datos.usuario_profesion,
        usuario_rol,
        estado,
        id
      ]
    );

    res.json({
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        message: 'El correo electrónico o el DPI ya están en uso por otro usuario.'
      });
    }
    res.status(500).json({
      message: 'No se pudo actualizar el usuario'
    });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El ID del usuario no es válido'
    });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Usuario WHERE usuario_id = $1 RETURNING usuario_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      message: 'No se pudo eliminar el usuario'
    });
  }
});

export default router;