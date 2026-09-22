import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import jwt from 'jsonwebtoken'

const router = Router();

function validateUsuario({ usuario_nombre, usuario_apellido, usuario_correo, usuario_password, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol }) {
  if (!usuario_nombre || usuario_nombre.length > 50) {
    return 'El nombre del usuario no puede estar vacío ni superar los 50 caracteres';
  }

  if (!usuario_apellido || usuario_apellido.length > 50) {
    return 'El apellido no puede estar vacío ni superar los 50 caracteres';
  }

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!usuario_correo || usuario_correo.length > 100 || !regexCorreo.test(usuario_correo)) {
    return 'Debe proporcionar un correo electrónico válido (máximo 100 caracteres)';
  }

  if (!usuario_password || usuario_password.length < 6) {
    return 'La contraseña es obligatoria y debe tener al menos 6 caracteres';
  }

  if (usuario_telefono && usuario_telefono.length > 20) {
    return 'El teléfono no puede superar los 20 caracteres';
  }

  if (usuario_dpi && usuario_dpi.length > 20) {
    return 'El DPI no puede superar los 20 caracteres';
  }

  if (usuario_profesion && usuario_profesion.length > 100) {
    return 'La profesión no puede superar los 100 caracteres';
  }

  const rolesValidos = ['Administrador', 'Candidato', 'Empresa']; 
  if (!usuario_rol || !rolesValidos.includes(usuario_rol)) {
    return 'El rol del usuario es obligatorio y debe ser válido';
  }

  return null;
}

// 1. RUTA PÚBLICA: Crear/Registrar un nuevo usuario (No requiere token)
router.post('/', async (req, res) => {
  const { 
    usuario_nombre, 
    usuario_apellido, 
    usuario_correo, 
    usuario_password, 
    usuario_perfil = null, 
    usuario_telefono = null, 
    usuario_dpi = null, 
    usuario_profesion = null, 
    usuario_rol 
  } = req.body;

  const validationError = validateUsuario({ 
    usuario_nombre, 
    usuario_apellido, 
    usuario_correo, 
    usuario_password, 
    usuario_telefono, 
    usuario_dpi, 
    usuario_profesion, 
    usuario_rol 
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Usuario (usuario_nombre, usuario_apellido, usuario_correo, usuario_password, usuario_perfil, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING usuario_id, usuario_nombre, usuario_apellido, usuario_correo, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol, fecha_registro, estado`,
      [usuario_nombre, usuario_apellido, usuario_correo, usuario_password, usuario_perfil, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol]
    );

    res.status(201).json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Error creando usuario:', error);

    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico o el DPI ya se encuentran registrados.' });
    }
    res.status(500).json({ message: 'No se pudo crear el usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { usuario_correo, usuario_password } = req.body;

  if (!usuario_correo || !usuario_password) {
    return res.status(400).json({ message: 'Por favor, ingrese correo y contraseña' });
  }

  try {
    // 1. Buscar el usuario en la base de datos
    const result = await pool.query(
      `SELECT * FROM Usuario WHERE usuario_correo = $1`,
      [usuario_correo]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 2. Validar contraseña (Ajusta si usas bcrypt.compare)
    if (usuario.usuario_password !== usuario_password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 3. Generar JWT (Ajusta la clave secreta según las variables de entorno)
    const secretKey = process.env.JWT_SECRET || 'mi_secreto_super_seguro';
    const token = jwt.sign(
      { 
        usuario_id: usuario.usuario_id, 
        usuario_correo: usuario.usuario_correo, 
        usuario_rol: usuario.usuario_rol 
      },
      secretKey,
      { expiresIn: '8h' }
    );

    // Omitir la contraseña en la respuesta final
    delete usuario.usuario_password;

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno en el servidor' });
  }
});

// A partir de aquí, todas las siguientes rutas SÍ requieren estar autenticado
router.use(requireAuth);

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT usuario_id, usuario_nombre, usuario_apellido, usuario_correo, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol, fecha_registro, estado 
       FROM Usuario 
       ORDER BY usuario_id ASC`
    );
    res.json({ usuarios: result.rows });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ message: 'No se pudieron consultar los usuarios' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID del usuario no es válido' });
  }

  try {
    const result = await pool.query(
      `SELECT usuario_id, usuario_nombre, usuario_apellido, usuario_correo, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol, fecha_registro, estado 
       FROM Usuario 
       WHERE usuario_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Error consultando usuario:', error);
    res.status(500).json({ message: 'No se pudo consultar el usuario' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID del usuario no es válido' });
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

  const validationError = validateUsuario({ 
    usuario_nombre, 
    usuario_apellido, 
    usuario_correo, 
    usuario_password, 
    usuario_telefono, 
    usuario_dpi, 
    usuario_profesion, 
    usuario_rol 
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE Usuario
       SET usuario_nombre = $1, usuario_apellido = $2, usuario_correo = $3, usuario_password = $4, 
           usuario_perfil = $5, usuario_telefono = $6, usuario_dpi = $7, usuario_profesion = $8, 
           usuario_rol = $9, estado = COALESCE($10, estado)
       WHERE usuario_id = $11
       RETURNING usuario_id, usuario_nombre, usuario_apellido, usuario_correo, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol, fecha_registro, estado`,
      [usuario_nombre, usuario_apellido, usuario_correo, usuario_password, usuario_perfil, usuario_telefono, usuario_dpi, usuario_profesion, usuario_rol, estado, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico o el DPI ya están en uso por otro usuario.' });
    }
    res.status(500).json({ message: 'No se pudo actualizar el usuario' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID del usuario no es válido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Usuario WHERE usuario_id = $1 RETURNING usuario_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'No se pudo eliminar el usuario' });
  }
});

export default router;