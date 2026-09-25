import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

function validateNotificacion({ titulo, descripcion, tipo, estado, usuario_id }) {
  if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
    return 'El titulo es obligatorio';
  }

  if (titulo.trim().length > 100) {
    return 'El titulo no puede exceder 100 caracteres';
  }

  if (descripcion !== undefined && (typeof descripcion !== 'string' || descripcion.trim().length < 1)) {
    return 'La descripcion debe ser un texto valido';
  }

  if (!tipo || typeof tipo !== 'string' || tipo.trim() === '') {
    return 'El tipo es obligatorio';
  }

  if (tipo.trim().length > 50) {
    return 'El tipo no puede exceder 50 caracteres';
  }

  if (estado !== undefined && typeof estado !== 'boolean') {
    return 'El estado debe ser un valor booleano';
  }

  if (!Number.isInteger(usuario_id) || usuario_id <= 0) {
    return 'El ID de usuario debe ser un entero positivo';
  }

  return null;
}

router.get('/', async (req, res) => {
  const { usuario_id } = req.query;

  try {
    let query = `
      SELECT notificacion_id, titulo, descripcion, tipo, fecha, estado, usuario_id
      FROM Notificacion
    `;
    const values = [];

    if (usuario_id !== undefined) {
      const parsedUsuarioId = Number(usuario_id);

      if (!Number.isInteger(parsedUsuarioId) || parsedUsuarioId <= 0) {
        return res.status(400).json({ message: 'El ID de usuario no es valido' });
      }

      query += ' WHERE usuario_id = $1';
      values.push(parsedUsuarioId);
    }

    query += ' ORDER BY notificacion_id ASC';

    const result = await pool.query(query, values);
    res.json({ notificaciones: result.rows });
  } catch (error) {
    console.error('Error listando notificaciones:', error);
    res.status(500).json({ message: 'No se pudieron consultar las notificaciones' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la notificacion no es valido' });
  }

  try {
    const result = await pool.query(
      `SELECT notificacion_id, titulo, descripcion, tipo, fecha, estado, usuario_id
       FROM Notificacion
       WHERE notificacion_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Notificacion no encontrada' });
    }

    res.json({ notificacion: result.rows[0] });
  } catch (error) {
    console.error('Error consultando notificacion:', error);
    res.status(500).json({ message: 'No se pudo consultar la notificacion' });
  }
});

router.post('/', async (req, res) => {
  const { titulo, descripcion = '', tipo, estado = false, usuario_id } = req.body;
  const validationError = validateNotificacion({ titulo, descripcion, tipo, estado, usuario_id });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Notificacion (titulo, descripcion, tipo, estado, usuario_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING notificacion_id, titulo, descripcion, tipo, fecha, estado, usuario_id`,
      [titulo.trim(), descripcion.trim(), tipo.trim(), estado, usuario_id]
    );

    res.status(201).json({ notificacion: result.rows[0] });
  } catch (error) {
    console.error('Error creando notificacion:', error);
    res.status(500).json({ message: 'No se pudo crear la notificacion' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la notificacion no es valido' });
  }

  const { titulo, descripcion, tipo, estado, usuario_id } = req.body;
  const validationError = validateNotificacion({ titulo, descripcion, tipo, estado, usuario_id });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await pool.query(
      `UPDATE Notificacion
       SET titulo = $1, descripcion = $2, tipo = $3, estado = $4, usuario_id = $5
       WHERE notificacion_id = $6
       RETURNING notificacion_id, titulo, descripcion, tipo, fecha, estado, usuario_id`,
      [titulo.trim(), descripcion.trim(), tipo.trim(), estado, usuario_id, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Notificacion no encontrada' });
    }

    res.json({ notificacion: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando notificacion:', error);
    res.status(500).json({ message: 'No se pudo actualizar la notificacion' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'El ID de la notificacion no es valido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM Notificacion WHERE notificacion_id = $1 RETURNING notificacion_id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Notificacion no encontrada' });
    }

    res.json({ message: 'Notificacion eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando notificacion:', error);
    res.status(500).json({ message: 'No se pudo eliminar la notificacion' });
  }
});

export default router;
