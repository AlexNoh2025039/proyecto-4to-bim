import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEmpresa({ empresa_nombre, empresa_correo, empresa_telefono, empresa_nit, empresa_direccion, usuario_admin }) {
  if (typeof empresa_nombre !== 'string' || !empresa_nombre.trim()) {
    return 'El nombre de la empresa es obligatorio';
  }

  if (empresa_nombre.trim().length > 100) {
    return 'El nombre de la empresa no puede superar los 100 caracteres';
  }

  if (typeof empresa_correo !== 'string' || !empresa_correo.trim() || !isValidEmail(empresa_correo.trim())) {
    return 'El correo electrónico es obligatorio y debe tener un formato válido';
  }

  if (empresa_correo.trim().length > 100) {
    return 'El correo no puede superar los 100 caracteres';
  }

  if (empresa_telefono && (typeof empresa_telefono !== 'string' || empresa_telefono.trim().length > 20)) {
    return 'El teléfono debe ser un texto y no superar los 20 caracteres';
  }

  if (empresa_nit && (typeof empresa_nit !== 'string' || empresa_nit.trim().length > 30)) {
    return 'El NIT no puede superar los 30 caracteres';
  }

  if (empresa_direccion && (typeof empresa_direccion !== 'string' || empresa_direccion.trim().length > 250)) {
    return 'La dirección no puede superar los 250 caracteres';
  }

  if (!Number.isInteger(usuario_admin) || usuario_admin <= 0) {
    return 'El ID del usuario administrador es obligatorio y debe ser un entero positivo';
  }

  return null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT empresa_id, empresa_nombre, empresa_descripcion, empresa_correo, 
              empresa_telefono, empresa_nit, empresa_direccion, usuario_admin 
       FROM Empresa 
       ORDER BY empresa_id ASC`
    );
    res.json({ empresas: result.rows });
  } catch (error) {
    console.error('Error listando empresas:', error);
    res.status(500).json({ message: 'No se pudieron consultar las empresas' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la empresa no es válido' });
  }

  try {
    const result = await pool.query(
      `SELECT empresa_id, empresa_nombre, empresa_descripcion, empresa_correo, 
              empresa_telefono, empresa_nit, empresa_direccion, usuario_admin 
       FROM Empresa 
       WHERE empresa_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    res.json({ empresa: result.rows[0] });
  } catch (error) {
    console.error('Error consultando empresa:', error);
    res.status(500).json({ message: 'No se pudo consultar la empresa' });
  }
});

router.post('/', async (req, res) => {
  const { 
    empresa_nombre, 
    empresa_descripcion, 
    empresa_correo, 
    empresa_telefono, 
    empresa_nit, 
    empresa_direccion, 
    usuario_admin 
  } = req.body;

  const validationError = validateEmpresa({ 
    empresa_nombre, 
    empresa_correo, 
    empresa_telefono, 
    empresa_nit, 
    empresa_direccion, 
    usuario_admin 
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Empresa (
        empresa_nombre, empresa_descripcion, empresa_correo, 
        empresa_telefono, empresa_nit, empresa_direccion, usuario_admin
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING empresa_id, empresa_nombre, empresa_descripcion, empresa_correo, 
                 empresa_telefono, empresa_nit, empresa_direccion, usuario_admin`,
      [
        empresa_nombre.trim(),
        empresa_descripcion ? empresa_descripcion.trim() : null,
        empresa_correo.trim(),
        empresa_telefono ? empresa_telefono.trim() : null,
        empresa_nit ? empresa_nit.trim() : null,
        empresa_direccion ? empresa_direccion.trim() : null,
        usuario_admin
      ]
    );

    res.status(201).json({ empresa: result.rows[0] });
  } catch (error) {
    console.error('Error creando empresa:', error);

    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico o el NIT ya están registrados' });
    }

    if (error.code === '23503') {
      return res.status(400).json({ message: 'El usuario_admin especificado no existe' });
    }

    res.status(500).json({ message: 'No se pudo registrar la empresa' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la empresa no es válido' });
  }

  const { 
    empresa_nombre, 
    empresa_descripcion, 
    empresa_correo, 
    empresa_telefono, 
    empresa_nit, 
    empresa_direccion, 
    usuario_admin 
  } = req.body;

  const validationError = validateEmpresa({ 
    empresa_nombre, 
    empresa_correo, 
    empresa_telefono, 
    empresa_nit, 
    empresa_direccion, 
    usuario_admin 
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE Empresa
       SET empresa_nombre = $1, 
           empresa_descripcion = $2, 
           empresa_correo = $3, 
           empresa_telefono = $4, 
           empresa_nit = $5, 
           empresa_direccion = $6, 
           usuario_admin = $7
       WHERE empresa_id = $8
       RETURNING empresa_id, empresa_nombre, empresa_descripcion, empresa_correo, 
                 empresa_telefono, empresa_nit, empresa_direccion, usuario_admin`,
      [
        empresa_nombre.trim(),
        empresa_descripcion ? empresa_descripcion.trim() : null,
        empresa_correo.trim(),
        empresa_telefono ? empresa_telefono.trim() : null,
        empresa_nit ? empresa_nit.trim() : null,
        empresa_direccion ? empresa_direccion.trim() : null,
        usuario_admin,
        id
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    res.json({ empresa: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando empresa:', error);

    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico o el NIT ya pertenecen a otra empresa' });
    }

    if (error.code === '23503') {
      return res.status(400).json({ message: 'El usuario_admin especificado no existe' });
    }

    res.status(500).json({ message: 'No se pudo actualizar la empresa' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la empresa no es válido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Empresa WHERE empresa_id = $1 RETURNING empresa_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando empresa:', error);
    res.status(500).json({ message: 'No se pudo eliminar la empresa' });
  }
});

export default router;